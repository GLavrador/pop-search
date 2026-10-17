import asyncio

from db import supabase

MAX_PENDING_LISTED = 50


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
        .select("id, user_id, titulo_video, descricao_completa, url_original, created_at, post")
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
