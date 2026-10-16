import os
import asyncio
from typing import Coroutine, Optional
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from services.embedding import create_embedding
from services.ai import analyze_video_content, TokenUsage
from services.downloader import Download, download_video, fetch_post
from dtos import AnalysisError, AnalysisJob, ExistingVideo, PostInfo, VideoMetadataDTO
from db import supabase
from core.logger import get_logger
from core.limiter import limiter
from core.exceptions import (
    validate_video_url,
    ALLOWED_DOMAINS,
    ContentBlockedError,
    ServiceQuotaExhaustedError,
)
from core.auth import CurrentUser
from services import jobs
from services.archive import find_existing
from services.usage import get_project_usage, get_quota, record_event
from asyncio import TimeoutError as AsyncTimeoutError

logger = get_logger("routers.videos")

router = APIRouter(prefix="/videos", tags=["Videos"])

INTERNAL_ERROR = "An internal error occurred while processing the video. Please try again."

POST_LOOKUP_TIMEOUT = 15


class VideoLink(BaseModel):
    url: str

    @field_validator('url')
    @classmethod
    def validate_url_domain(cls, v: str) -> str:
        if not validate_video_url(v):
            raise ValueError(f"URL must be from {' or '.join(ALLOWED_DOMAINS)}")
        return v


class VideoAnalysisRequest(VideoLink):
    analyze_scenes: bool = True
    analyze_audio: bool = True


def _already_archived(existing: dict, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": detail, "existing": ExistingVideo(**existing).model_dump()},
    )


def _as_job(row: dict) -> AnalysisJob:
    return AnalysisJob(
        id=row["id"],
        url=row["url"],
        stage=row["stage"],
        analyze_scenes=row["analyze_scenes"],
        analyze_audio=row["analyze_audio"],
        result=row.get("result") if row["stage"] == "done" else None,
        error=AnalysisError(
            status=row.get("error_status") or 500,
            detail=row.get("error_detail") or INTERNAL_ERROR,
        ) if row["stage"] == "failed" else None,
        created_at=row["created_at"],
    )


# The analysis this process is running for each user, so a cancel can reach it.
_running: dict[str, asyncio.Task] = {}


def _forget(user_id: str, task: asyncio.Task) -> None:
    # A cancelled run may end after the next one began: that entry is not its own.
    if _running.get(user_id) is task:
        del _running[user_id]


async def launch(user_id: str, work: Coroutine) -> None:
    """Runs an analysis apart from the request that asked for it, which answers
    at once and leaves the progress to be read from the job."""
    task = asyncio.create_task(work)
    _running[user_id] = task
    task.add_done_callback(lambda done: _forget(user_id, done))


def _remove(path: Optional[str]) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
            logger.debug(f"Cleaned up temp file: {path}")
    except OSError as e:
        logger.warning("Could not remove temp file: error_type=%s", type(e).__name__)


async def _download(url: str) -> Download:
    loop = asyncio.get_event_loop()
    download = loop.run_in_executor(None, download_video, url)

    try:
        return await asyncio.shield(download)
    except asyncio.CancelledError:
        # The thread cannot be stopped, so its file is removed when it lands.
        download.add_done_callback(
            lambda landed: None if landed.cancelled() or landed.exception() else _remove(landed.result().path)
        )
        raise


async def _report_failure(job_id: str, status: int, detail: str) -> None:
    try:
        await jobs.fail(job_id, status, detail)
    except Exception as e:
        logger.error("Could not record job failure: job_id=%s error_type=%s", job_id, type(e).__name__)


async def _run_analysis(job_id: str, user_id: str, body: VideoAnalysisRequest) -> None:
    video_path = None
    # Only set once the video reaches Gemini: a failed download costs no tokens
    # and must not consume the user's quota.
    charged = False
    succeeded = False
    failure_reason = None
    tokens = TokenUsage()

    async def reached(stage: str) -> None:
        await jobs.advance(job_id, stage)

    try:
        await reached("downloading")
        download = await _download(body.url)
        video_path = download.path

        charged = True
        analysis_result = await analyze_video_content(
            video_path, body.analyze_scenes, body.analyze_audio, tokens, on_stage=reached
        )

        if not analysis_result:
            failure_reason = "no_result"
            await _report_failure(job_id, 500, "Failed to analyze video content")
            return

        if "metadados_estruturados" not in analysis_result:
            analysis_result["metadados_estruturados"] = {}

        analysis_result["url_original"] = body.url
        analysis_result["post"] = download.post

        try:
            dto = VideoMetadataDTO(**analysis_result)
        except ValueError as e:
            logger.error("Invalid AI output: job_id=%s error_type=%s", job_id, type(e).__name__)
            failure_reason = "schema_validation"
            await _report_failure(job_id, 500, "Internal AI schema validation failed")
            return

        await jobs.finish(job_id, dto.model_dump())
        succeeded = True

    except asyncio.CancelledError:
        # The job row is already gone: whoever cancelled removed it first.
        logger.info(f"Analysis {job_id} cancelled")
        failure_reason = "cancelled"

    except AsyncTimeoutError:
        logger.error("Timed out waiting for AI")
        failure_reason = "timeout"
        await _report_failure(
            job_id, 504, "The AI service took too long to respond. Please try again later."
        )

    except ServiceQuotaExhaustedError:
        # Google refused before processing anything, so no tokens were spent and
        # the user keeps their analysis.
        charged = False
        await _report_failure(
            job_id, 503,
            "The AI service is out of capacity right now. Nothing was taken from your quota. Try again later.",
        )

    except ContentBlockedError as e:
        logger.warning("Analysis blocked: job_id=%s error_type=%s", job_id, type(e).__name__)
        failure_reason = f"blocked:{e.reason}"
        await _report_failure(
            job_id, 422,
            "The AI declined to describe this video, usually because of its content. Nothing is wrong with the link.",
        )

    except Exception as e:
        logger.error("Analysis failed: job_id=%s error_type=%s", job_id, type(e).__name__)
        failure_reason = failure_reason or "internal_error"
        await _report_failure(job_id, 500, INTERNAL_ERROR)

    finally:
        if charged:
            await record_event(
                user_id, "analysis", succeeded, failure_reason,
                tokens.prompt, tokens.output, tokens.total,
            )

        _remove(video_path)


@router.post("/analyze", status_code=202, response_model=AnalysisJob)
@limiter.limit("5/minute")
async def start_analysis(request: Request, body: VideoAnalysisRequest, user_id: str = CurrentUser):
    logger.info("Analysis requested: url_chars=%s", len(body.url))

    # Before the quota: a copy is refused whatever the user has left, and
    # finding out here costs them nothing.
    existing = await find_existing(body.url)
    if existing:
        logger.info("Video already archived: video_id=%s", existing["id"])
        return _already_archived(
            existing,
            "This video is already in the archive. Nothing was taken from your quota.",
        )

    quota = await get_quota(user_id)
    if quota.is_exhausted:
        logger.info(f"Quota exhausted for {user_id}: {quota.used}/{quota.limit}")
        raise HTTPException(
            status_code=429,
            detail=f"You have used all {quota.limit} analyses for this month. Your quota renews on {quota.resets_at[:10]}.",
        )

    # Checked after the personal quota so a user at their own limit is told
    # that, which is the actionable message, rather than blaming the project.
    project = await get_project_usage()
    if project.is_exhausted:
        logger.warning(f"Daily project limit reached: {project.analyses_today}/{project.daily_limit}")
        raise HTTPException(
            status_code=503,
            detail="The archive has reached its analysis limit for today. Nothing was taken from your quota. Try again tomorrow.",
        )

    try:
        current = await jobs.current(user_id)

        # One at a time: the quota is only charged when an analysis ends, so
        # several started together would all slip under it.
        if current and jobs.is_running(current):
            raise HTTPException(
                status_code=409,
                detail="You already have an analysis running. Wait for it to finish or cancel it.",
            )

        job = await jobs.start(user_id, body.url, body.analyze_scenes, body.analyze_audio)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Could not start analysis: error_type=%s", type(e).__name__)
        raise HTTPException(status_code=500, detail=INTERNAL_ERROR)

    await launch(user_id, _run_analysis(job["id"], user_id, body))
    return _as_job(job)


@router.get("/analyze", response_model=Optional[AnalysisJob])
@limiter.limit("120/minute")
async def read_analysis(request: Request, user_id: str = CurrentUser):
    """The user's analysis: running, failed, or finished and waiting to be saved."""
    try:
        current = await jobs.current(user_id)
    except Exception as e:
        logger.error("Could not read analysis: error_type=%s", type(e).__name__)
        raise HTTPException(status_code=500, detail=INTERNAL_ERROR)

    return _as_job(current) if current else None


@router.delete("/analyze", status_code=204)
@limiter.limit("30/minute")
async def discard_analysis(request: Request, user_id: str = CurrentUser):
    """Cancels the analysis if it is running and forgets it either way."""
    # The row goes first, so the run being stopped finds nothing left to write to.
    try:
        await jobs.discard(user_id)
    except Exception as e:
        logger.error("Could not discard analysis: error_type=%s", type(e).__name__)
        raise HTTPException(status_code=500, detail=INTERNAL_ERROR)

    task = _running.get(user_id)
    if task:
        task.cancel()

    return Response(status_code=204)


@router.post("/post", response_model=Optional[PostInfo])
@limiter.limit("20/minute")
async def look_up_post(request: Request, body: VideoLink, user_id: str = CurrentUser):
    """The text and the picture of a post, for the form of a video that is being
    described by hand. Asked for apart from the save, which never waits on X, and
    only of X: the model refuses any other link."""
    try:
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, fetch_post, body.url), timeout=POST_LOOKUP_TIMEOUT
        )
    except Exception as e:
        logger.warning("Could not look up post: error_type=%s", type(e).__name__)
        return None


@router.post("")
@limiter.limit("10/minute")
async def save_video(request: Request, metadata: VideoMetadataDTO, user_id: str = CurrentUser):
    logger.info("Save requested: title_chars=%s", len(metadata.titulo_sugerido))

    if not metadata.url_original:
        raise HTTPException(status_code=400, detail="url_original is required for saving")

    existing = await find_existing(metadata.url_original)
    if existing:
        logger.info("Refusing duplicate: video_id=%s", existing["id"])
        return _already_archived(existing, "This video is already in the archive.")

    try:
        loop = asyncio.get_event_loop()
        vector = await loop.run_in_executor(None, create_embedding, metadata)

        db_payload = {
            "user_id": user_id,
            "titulo_video": metadata.titulo_sugerido,
            "descricao_completa": metadata.descricao_completa,
            "url_original": metadata.url_original,
            "metadados_estruturados": metadata.metadados_estruturados.model_dump(),
            "post": metadata.post.to_store() if metadata.post else None,
            "embedding": vector
        }

        logger.info("Persisting to Supabase...")
        data, count = await loop.run_in_executor(
            None, lambda: supabase.table("videos").insert(db_payload).execute()
        )

        logger.info(f"Video saved successfully. ID: {data[1][0]['id']}")

        # Measured, not limited: saving always costs an embedding call.
        await record_event(user_id, "save")

        # The analysis behind this save has served its purpose.
        try:
            await jobs.discard(user_id, metadata.url_original)
        except Exception as e:
            logger.warning("Could not clear saved analysis: error_type=%s", type(e).__name__)

        return {
            "status": "success",
            "id": data[1][0]['id'],
            "message": "Video indexed successfully"
        }

    except Exception as e:
        logger.error("Could not save video: error_type=%s", type(e).__name__)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while saving the video. Please try again."
        )
