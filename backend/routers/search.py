import asyncio
import time
from fastapi import APIRouter, HTTPException, Request, Response
from services.embedding import embed_query
from dtos import SearchRequest, SearchResult
from db import supabase
from core.gemini import EMBEDDING_DIMENSIONS
from core.logger import get_logger
from core.limiter import limiter

logger = get_logger("routers.search")

router = APIRouter(tags=["Search"])

ZERO_VECTOR = [0.0] * EMBEDDING_DIMENSIONS


def _ms_since(moment: float) -> float:
    return (time.perf_counter() - moment) * 1000


@router.post("/search", response_model=list[SearchResult])
@limiter.limit("20/minute")
async def search_videos(request: Request, response: Response, search_request: SearchRequest):
    logger.info(f"Search requested: '{search_request.query}' (mode: {search_request.mode})")

    started = time.perf_counter()
    # How long each step took, sent back in the Server-Timing header.
    steps: dict[str, float] = {}

    try:
        if search_request.mode == "text":
            query_vector = ZERO_VECTOR
            logger.debug("Text mode: skipping embedding generation")
        else:
            loop = asyncio.get_event_loop()
            query_vector = await loop.run_in_executor(None, embed_query, search_request.query)
            steps["embed"] = _ms_since(started)

        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": search_request.threshold,
            "match_count": search_request.limit,
            "query_text": search_request.query,
            "search_mode": search_request.mode,
        }

        logger.debug(f"Executing RPC match_videos with query: {search_request.query}")

        asked = time.perf_counter()
        matches = supabase.rpc("match_videos", rpc_params).execute()
        steps["db"] = _ms_since(asked)

        # No post-filtering here on purpose. match_threshold applies to the vector
        # branch inside the RPC; re-applying it in Python would discard every
        # full-text match and collapse the hybrid search back into a vector-only
        # one. The RPC already honours match_count exactly.
        results = matches.data or []

        steps["total"] = _ms_since(started)
        response.headers["Server-Timing"] = ", ".join(
            f"{step};dur={ms:.1f}" for step, ms in steps.items()
        )

        logger.info(f"Search returned {len(results)} results")
        return results

    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred during search. Please try again."
        )
