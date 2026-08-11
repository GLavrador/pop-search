import asyncio

from fastapi import APIRouter, HTTPException, Request

from core.auth import CurrentUser
from core.limiter import limiter
from core.logger import get_logger
from db import supabase
from dtos import MyVideo, QuotaStatus
from services.usage import get_quota

logger = get_logger("routers.me")

router = APIRouter(prefix="/me", tags=["Me"])

MAX_VIDEOS = 200


@router.get("/quota", response_model=QuotaStatus)
@limiter.limit("60/minute")
async def read_my_quota(request: Request, user_id: str = CurrentUser):
    try:
        quota = await get_quota(user_id)
        return QuotaStatus(
            used=quota.used,
            limit=quota.limit,
            remaining=quota.remaining,
            resets_at=quota.resets_at,
        )
    except Exception as e:
        logger.exception(f"Failed to read quota for {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while loading your usage. Please try again.",
        )


@router.get("/videos", response_model=list[MyVideo])
@limiter.limit("30/minute")
async def list_my_videos(request: Request, user_id: str = CurrentUser):
    def query():
        return (
            supabase.table("videos")
            .select("id, titulo_video, descricao_completa, url_original, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(MAX_VIDEOS)
            .execute()
        )

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, query)
        return response.data or []
    except Exception as e:
        logger.exception(f"Failed to list videos for {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while loading your videos. Please try again.",
        )
