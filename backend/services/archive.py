import asyncio
import re
from typing import Optional
from urllib.parse import urlparse

from core.logger import get_logger
from db import supabase

logger = get_logger("services.archive")

POST = re.compile(r"/status/(\d+)(?:/video/(\d+))?")


def video_key(url: str) -> Optional[tuple[str, str]]:
    """The post and which of its videos, however the link was written: the
    domain, the author, a tracking query and a trailing /video/1 all vary."""
    match = POST.search(urlparse(url).path)
    return (match.group(1), match.group(2) or "1") if match else None


def _find_existing(url: str) -> Optional[dict]:
    key = video_key(url)
    query = supabase.table("videos").select("id, titulo_video, url_original, created_at, approved, user_id")

    if key is None:
        rows = query.eq("url_original", url).limit(1).execute().data or []
        return rows[0] if rows else None

    # Narrowed as text, then compared exactly: /status/12 is also inside /status/123.
    rows = query.like("url_original", f"%/status/{key[0]}%").limit(20).execute().data or []
    return next((row for row in rows if video_key(row["url_original"]) == key), None)


async def find_existing(url: str) -> Optional[dict]:
    """The archived video this link points to, or None. A failed lookup also
    answers None: the unique constraint is still there to refuse a real copy."""
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _find_existing, url)
    except Exception as e:
        logger.warning(f"Could not check the archive for {url}: {e}")
        return None
