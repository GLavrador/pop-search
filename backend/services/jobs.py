import asyncio
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from core.logger import get_logger
from db import supabase

logger = get_logger("services.jobs")

TABLE = "analysis_jobs"

RUNNING_STAGES = ("queued", "downloading", "uploading", "watching", "writing")

# Longer than any stage is allowed to last, so a job still running after this
# died with the server that was working on it.
STALE_AFTER = timedelta(minutes=10)

INTERRUPTED_DETAIL = (
    "The analysis was interrupted on the server. Nothing was taken from your quota. Try again."
)

ATTEMPTS = 3


def is_running(job: dict) -> bool:
    return job["stage"] in RUNNING_STAGES


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_stale(job: dict, now: Optional[datetime] = None) -> bool:
    now = now or datetime.now(timezone.utc)
    return now - datetime.fromisoformat(job["updated_at"]) > STALE_AFTER


def _start(user_id: str, url: str, analyze_scenes: bool, analyze_audio: bool) -> dict:
    now = _now()
    row = {
        "user_id": user_id,
        "id": str(uuid.uuid4()),
        "url": url,
        "analyze_scenes": analyze_scenes,
        "analyze_audio": analyze_audio,
        "stage": "queued",
        "result": None,
        "error_status": None,
        "error_detail": None,
        "created_at": now,
        "updated_at": now,
    }
    # One row per user: starting again replaces whatever the last analysis left.
    supabase.table(TABLE).upsert(row, on_conflict="user_id").execute()
    return row


def _update(job_id: str, changes: dict) -> None:
    # Matched by the run, not the user: a cancelled run must not write over the next one.
    supabase.table(TABLE).update({**changes, "updated_at": _now()}).eq("id", job_id).execute()


def _current(user_id: str) -> Optional[dict]:
    rows = supabase.table(TABLE).select("*").eq("user_id", user_id).limit(1).execute().data or []
    if not rows:
        return None

    job = rows[0]
    if is_running(job) and _is_stale(job):
        return {**job, "stage": "failed", "error_status": 500, "error_detail": INTERRUPTED_DETAIL}
    return job


def _discard(user_id: str, url: Optional[str]) -> Optional[dict]:
    query = supabase.table(TABLE).delete().eq("user_id", user_id)
    if url is not None:
        query = query.eq("url", url)
    rows = query.execute().data or []
    return rows[0] if rows else None


def _steadily(function, *args):
    """Tries again when the connection drops. The write that ends an analysis is
    the one that must not be lost: the analysis itself was already paid for."""
    for attempt in range(1, ATTEMPTS + 1):
        try:
            return function(*args)
        except httpx.TransportError as e:
            if attempt == ATTEMPTS:
                raise
            logger.warning(f"Connection dropped on {function.__name__} (attempt {attempt}): {e}")
            time.sleep(0.3 * attempt)


async def _in_thread(function, *args):
    return await asyncio.get_event_loop().run_in_executor(None, _steadily, function, *args)


async def start(user_id: str, url: str, analyze_scenes: bool, analyze_audio: bool) -> dict:
    return await _in_thread(_start, user_id, url, analyze_scenes, analyze_audio)


async def advance(job_id: str, stage: str) -> None:
    """Progress is worth showing but not worth failing for."""
    try:
        await _in_thread(_update, job_id, {"stage": stage})
    except Exception as e:
        logger.warning(f"Could not record stage '{stage}' of job {job_id}: {e}")


async def finish(job_id: str, result: dict) -> None:
    await _in_thread(_update, job_id, {"stage": "done", "result": result})


async def fail(job_id: str, status: int, detail: str) -> None:
    await _in_thread(
        _update, job_id, {"stage": "failed", "error_status": status, "error_detail": detail}
    )


async def current(user_id: str) -> Optional[dict]:
    return await _in_thread(_current, user_id)


async def discard(user_id: str, url: Optional[str] = None) -> Optional[dict]:
    """Removes the user's analysis and returns it. With a url, only when it is
    the analysis of that link."""
    return await _in_thread(_discard, user_id, url)
