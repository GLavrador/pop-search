import asyncio
import platform
import time

import fastapi
from fastapi import APIRouter, Request
from yt_dlp.version import __version__ as downloader_version

from core.gemini import EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, GENERATION_MODEL
from core.limiter import limiter
from core.logger import get_logger
from db import supabase
from dtos import AiStatus, DatabaseStatus, SystemReport
from services.embedding import QUERY_CACHE_SIZE, questions_kept

logger = get_logger("routers.health")

router = APIRouter(tags=["Health"])

VERSION = "1.0.0"
STARTED = time.monotonic()


@router.get("/")
async def health_check():
    return {
        "status": "ok",
        "version": VERSION
    }


def _count_videos() -> int:
    answer = supabase.table("videos").select("id", count="exact", head=True).execute()
    return answer.count or 0


async def _database_status() -> DatabaseStatus:
    asked = time.perf_counter()
    try:
        videos = await asyncio.to_thread(_count_videos)
    except Exception as e:
        logger.error(f"Database did not answer the system report: {e}")
        return DatabaseStatus(ok=False)

    return DatabaseStatus(ok=True, ms=round((time.perf_counter() - asked) * 1000, 1), videos=videos)


# Nothing here calls the AI: asking it how it is would spend the quota it is asked about.
@router.get("/system", response_model=SystemReport)
@limiter.limit("30/minute")
async def system_report(request: Request):
    return SystemReport(
        version=VERSION,
        uptime_seconds=int(time.monotonic() - STARTED),
        python=platform.python_version(),
        framework=f"FastAPI {fastapi.__version__}",
        downloader=f"yt-dlp {downloader_version}",
        database=await _database_status(),
        ai=AiStatus(
            analysis_model=GENERATION_MODEL,
            embedding_model=EMBEDDING_MODEL.removeprefix("models/"),
            dimensions=EMBEDDING_DIMENSIONS,
            questions_kept=questions_kept(),
            questions_room=QUERY_CACHE_SIZE,
        ),
    )
