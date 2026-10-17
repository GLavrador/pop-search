import asyncio
from datetime import datetime, timedelta, timezone

from db import supabase

MAX_PENDING_LISTED = 50

APPROVED_WITHIN_DAYS = 30
MAX_APPROVED_LISTED = 30
VIDEOS_SHOWN_PER_ACCOUNT = 5

VIDEO_COLUMNS = "id, user_id, titulo_video, descricao_completa, url_original, created_at, post"


def _fetch_pending() -> list[dict]:
    profiles = (
        supabase.table("profiles")
        .select("id, display_name, created_at")
        .eq("approved", False)
        .order("created_at", desc=True)
        .limit(MAX_PENDING_LISTED)
        .execute()
    ).data or []

    if not profiles:
        return []

    videos = (
        supabase.table("videos")
        .select(VIDEO_COLUMNS)
        .eq("approved", False)
        .in_("user_id", [profile["id"] for profile in profiles])
        .execute()
    ).data or []
    by_owner = {video["user_id"]: video for video in videos}

    accounts = [
        {
            "user_id": profile["id"],
            "display_name": profile["display_name"],
            "created_at": profile["created_at"],
            "video": by_owner.get(profile["id"]),
        }
        for profile in profiles
    ]

    # The ones with a video come first: they are the ones with something to judge.
    return sorted(accounts, key=lambda account: account["video"] is None)


async def list_pending() -> list[dict]:
    """Accounts under review, newest first, each with the video it is waiting on."""
    return await asyncio.to_thread(_fetch_pending)


def _fetch_approved() -> list[dict]:
    since = datetime.now(timezone.utc) - timedelta(days=APPROVED_WITHIN_DAYS)
    profiles = (
        supabase.table("profiles")
        .select("id, display_name, created_at, approved_at")
        .gte("approved_at", since.isoformat())
        .order("approved_at", desc=True)
        .limit(MAX_APPROVED_LISTED)
        .execute()
    ).data or []

    if not profiles:
        return []

    videos = (
        supabase.table("videos")
        .select(VIDEO_COLUMNS)
        .in_("user_id", [profile["id"] for profile in profiles])
        .order("created_at", desc=True)
        .execute()
    ).data or []

    by_owner: dict[str, list[dict]] = {}
    for video in videos:
        by_owner.setdefault(video["user_id"], []).append(video)

    return [
        {
            "user_id": profile["id"],
            "display_name": profile["display_name"],
            "created_at": profile["created_at"],
            "approved_at": profile["approved_at"],
            "video_count": len(by_owner.get(profile["id"], [])),
            "videos": by_owner.get(profile["id"], [])[:VIDEOS_SHOWN_PER_ACCOUNT],
        }
        for profile in profiles
    ]


async def list_approved() -> list[dict]:
    """Accounts approved in the last days, newest first, each with its latest videos."""
    return await asyncio.to_thread(_fetch_approved)


def _approve(user_id: str) -> bool:
    return bool(supabase.rpc("approve_account", {"p_user_id": user_id}).execute().data)


async def approve(user_id: str) -> bool:
    """Approves the account and makes its video public, in one transaction.
    False when the account was not under review."""
    return await asyncio.to_thread(_approve, user_id)


def _remove_pending_video(user_id: str) -> bool:
    rows = (
        supabase.table("videos")
        .delete()
        .eq("user_id", user_id)
        .eq("approved", False)
        .execute()
    ).data or []
    return bool(rows)


async def remove_pending_video(user_id: str) -> bool:
    return await asyncio.to_thread(_remove_pending_video, user_id)
