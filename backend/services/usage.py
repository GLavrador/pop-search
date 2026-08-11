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
    limit = rows[0]["monthly_analysis_limit"] if rows else DEFAULT_MONTHLY_LIMIT

    counted = (
        supabase.table("usage_events")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("kind", "analysis")
        .gte("created_at", _month_start().isoformat())
        .execute()
    )

    return Quota(
        used=counted.count or 0,
        limit=limit,
        resets_at=_next_month_start().isoformat(),
    )


async def get_quota(user_id: str) -> Quota:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_quota, user_id)


async def record_event(
    user_id: str,
    kind: str,
    succeeded: bool = True,
    failure_reason: Optional[str] = None,
) -> None:
    """Never raises: losing an accounting row must not fail a request that
    already succeeded."""
    payload = {
        "user_id": user_id,
        "kind": kind,
        "succeeded": succeeded,
        "failure_reason": failure_reason,
    }

    def insert():
        return supabase.table("usage_events").insert(payload).execute()

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, insert)
    except Exception as e:
        logger.error(f"Failed to record {kind} usage for {user_id}: {e}")
