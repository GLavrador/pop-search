import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from core.logger import get_logger
from db import supabase

logger = get_logger("services.usage")

DEFAULT_MONTHLY_LIMIT = 20


@dataclass
class Quota:
    used: int
    limit: int
    resets_at: str
    tokens_this_month: int = 0

    @property
    def remaining(self) -> int:
        return max(self.limit - self.used, 0)

    @property
    def is_exhausted(self) -> bool:
        return self.used >= self.limit


def _month_start(now: Optional[datetime] = None) -> datetime:
    now = now or datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _next_month_start(now: Optional[datetime] = None) -> datetime:
    start = _month_start(now)
    return start.replace(year=start.year + 1, month=1) if start.month == 12 \
        else start.replace(month=start.month + 1)


def _fetch_quota(user_id: str) -> Quota:
    profile = (
        supabase.table("profiles")
        .select("monthly_analysis_limit")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = profile.data or []

    if rows:
        limit = rows[0]["monthly_analysis_limit"]
    else:
        # The signup trigger should make this impossible, so reaching here means
        # it failed and the user is silently on the default allowance.
        logger.warning(f"No profile for {user_id}; falling back to the default limit")
        limit = DEFAULT_MONTHLY_LIMIT

    since = _month_start().isoformat()

    counted = (
        supabase.table("usage_events")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("kind", "analysis")
        .gte("created_at", since)
        .execute()
    )

    # Summed here rather than in SQL because PostgREST has no aggregate for it
    # without a view, and a month of one user's rows is a handful.
    spent = (
        supabase.table("usage_events")
        .select("total_tokens")
        .eq("user_id", user_id)
        .gte("created_at", since)
        .execute()
    )
    tokens = sum((row.get("total_tokens") or 0) for row in (spent.data or []))

    return Quota(
        used=counted.count or 0,
        limit=limit,
        resets_at=_next_month_start().isoformat(),
        tokens_this_month=tokens,
    )


async def get_quota(user_id: str) -> Quota:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_quota, user_id)


@dataclass
class UserUsage:
    user_id: str
    display_name: str
    analyses: int
    tokens: int
    limit: int


def _fetch_is_admin(user_id: str) -> bool:
    response = (
        supabase.table("profiles")
        .select("is_admin")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return bool(rows and rows[0].get("is_admin"))


async def is_admin(user_id: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_is_admin, user_id)


def _fetch_all_usage() -> list[UserUsage]:
    profiles = (
        supabase.table("profiles")
        .select("id, display_name, monthly_analysis_limit")
        .execute()
    )

    events = (
        supabase.table("usage_events")
        .select("user_id, kind, total_tokens")
        .gte("created_at", _month_start().isoformat())
        .execute()
    )

    analyses: dict[str, int] = {}
    tokens: dict[str, int] = {}

    for row in events.data or []:
        owner = row["user_id"]
        tokens[owner] = tokens.get(owner, 0) + (row.get("total_tokens") or 0)
        if row.get("kind") == "analysis":
            analyses[owner] = analyses.get(owner, 0) + 1

    summary = [
        UserUsage(
            user_id=profile["id"],
            display_name=profile["display_name"],
            analyses=analyses.get(profile["id"], 0),
            tokens=tokens.get(profile["id"], 0),
            limit=profile["monthly_analysis_limit"],
        )
        for profile in (profiles.data or [])
    ]

    return sorted(summary, key=lambda item: item.tokens, reverse=True)


async def get_all_usage() -> list[UserUsage]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_all_usage)


async def record_event(
    user_id: str,
    kind: str,
    succeeded: bool = True,
    failure_reason: Optional[str] = None,
    prompt_tokens: Optional[int] = None,
    output_tokens: Optional[int] = None,
    total_tokens: Optional[int] = None,
) -> None:
    """Never raises: losing an accounting row must not fail a request that
    already succeeded."""
    payload = {
        "user_id": user_id,
        "kind": kind,
        "succeeded": succeeded,
        "failure_reason": failure_reason,
        "prompt_tokens": prompt_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }

    def insert():
        return supabase.table("usage_events").insert(payload).execute()

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, insert)
    except Exception as e:
        logger.error(f"Failed to record {kind} usage for {user_id}: {e}")
