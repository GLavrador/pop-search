import os
import asyncio
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from services.embedding import create_embedding
from services.ai import analyze_video_content, TokenUsage
from services.downloader import download_video
from dtos import VideoMetadataDTO
from db import supabase
from core.logger import get_logger
from core.limiter import limiter
from core.exceptions import validate_video_url, ALLOWED_DOMAINS, ContentBlockedError
from core.auth import CurrentUser
from services.usage import get_quota, record_event
from asyncio import TimeoutError as AsyncTimeoutError

logger = get_logger("routers.videos")

router = APIRouter(prefix="/videos", tags=["Videos"])


class VideoAnalysisRequest(BaseModel):
    url: str
    analyze_scenes: bool = True
    analyze_audio: bool = True
    
    @field_validator('url')
    @classmethod
    def validate_url_domain(cls, v: str) -> str:
        if not validate_video_url(v):
            raise ValueError(f"URL must be from {' or '.join(ALLOWED_DOMAINS)}")
        return v


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_from_url(request: Request, body: VideoAnalysisRequest, user_id: str = CurrentUser):
    logger.info(f"Analysis requested by {user_id} for URL: {body.url} (Scenes: {body.analyze_scenes}, Audio: {body.analyze_audio})")

    quota = await get_quota(user_id)
    if quota.is_exhausted:
        logger.info(f"Quota exhausted for {user_id}: {quota.used}/{quota.limit}")
        raise HTTPException(
            status_code=429,
            detail=f"You have used all {quota.limit} analyses for this month. Your quota renews on {quota.resets_at[:10]}.",
        )

    video_path = None
    # Only set once the video reaches Gemini: a failed download costs no tokens
    # and must not consume the user's quota.
    charged = False
    succeeded = False
    failure_reason = None
    tokens = TokenUsage()

    try:
        loop = asyncio.get_event_loop()
        video_path = await loop.run_in_executor(None, download_video, body.url)

        charged = True
        analysis_result = await analyze_video_content(
            video_path, body.analyze_scenes, body.analyze_audio, tokens
        )

        if not analysis_result:
            failure_reason = "no_result"
            raise HTTPException(status_code=500, detail="Failed to analyze video content")

        if "metadados_estruturados" not in analysis_result:
            analysis_result["metadados_estruturados"] = {}

        analysis_result["url_original"] = body.url

        try:
            dto = VideoMetadataDTO(**analysis_result)
            succeeded = True
            return dto.model_dump()
        except ValueError as e:
            logger.error(f"Validation error parsing AI output: {e}\nRaw output: {analysis_result}")
            failure_reason = "schema_validation"
            raise HTTPException(status_code=500, detail="Internal AI schema validation failed")

    except AsyncTimeoutError:
        logger.error("Request timed out waiting for AI")
        failure_reason = "timeout"
        raise HTTPException(
            status_code=504,
            detail="The AI service took too long to respond. Please try again later."
        )

    except ContentBlockedError as e:
        logger.warning(f"Analysis blocked for {body.url}: {e.reason}")
        failure_reason = f"blocked:{e.reason}"
        raise HTTPException(
            status_code=422,
            detail="The AI declined to describe this video, usually because of its content. Nothing is wrong with the link."
        )

    except HTTPException as he:
        raise he

    except Exception as e:
        logger.exception(f"Error processing video flow: {e}")
        failure_reason = failure_reason or "internal_error"
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while processing the video. Please try again."
        )

    finally:
        if charged:
            await record_event(
                user_id, "analysis", succeeded, failure_reason,
                tokens.prompt, tokens.output, tokens.total,
            )

        if video_path and os.path.exists(video_path):
            os.remove(video_path)
            logger.debug(f"Cleaned up temp file: {video_path}")


@router.post("")
@limiter.limit("10/minute")
async def save_video(request: Request, metadata: VideoMetadataDTO, user_id: str = CurrentUser):
    logger.info(f"Save request from {user_id} for video: {metadata.titulo_sugerido}")
    
    if not metadata.url_original:
        raise HTTPException(status_code=400, detail="url_original is required for saving")

    try:
        loop = asyncio.get_event_loop()
        vector = await loop.run_in_executor(None, create_embedding, metadata)
        
        db_payload = {
            "user_id": user_id,
            "titulo_video": metadata.titulo_sugerido,
            "descricao_completa": metadata.descricao_completa,
            "url_original": metadata.url_original,
            "metadados_estruturados": metadata.metadados_estruturados.model_dump(),
            "embedding": vector
        }
        
        logger.info("Persisting to Supabase...")
        data, count = supabase.table("videos").insert(db_payload).execute()
        
        logger.info(f"Video saved successfully. ID: {data[1][0]['id']}")

        # Measured, not limited: saving always costs an embedding call.
        await record_event(user_id, "save")

        return {
            "status": "success", 
            "id": data[1][0]['id'],
            "message": "Video indexed successfully"
        }

    except Exception as e:
        logger.exception(f"Failed to save video: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An internal error occurred while saving the video. Please try again."
        )
