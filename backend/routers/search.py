import asyncio
from fastapi import APIRouter, HTTPException, Request
from services.embedding import embed_query
from dtos import SearchRequest, SearchResult, SearchExplain, RankedEntry, FusionRow
from db import supabase
from core.logger import get_logger
from core.limiter import limiter

logger = get_logger("routers.search")

router = APIRouter(tags=["Search"])

EMBEDDING_DIMENSIONS = 768
ZERO_VECTOR = [0.0] * EMBEDDING_DIMENSIONS

# Mirrors the rrf_k default in match_videos. The explanation is only honest
# while the two agree.
RRF_K = 50

MIN_BRANCH_ROWS = 10
MAX_BRANCH_ROWS = 25

@router.post("/search", response_model=list[SearchResult])
@limiter.limit("20/minute")
async def search_videos(request: Request, search_request: SearchRequest):
    logger.info(f"Search requested: '{search_request.query}' (mode: {search_request.mode})")

    try:
        if search_request.mode == "text":
            query_vector = ZERO_VECTOR
            logger.debug("Text mode: skipping embedding generation")
        else:
            loop = asyncio.get_event_loop()
            query_vector = await loop.run_in_executor(None, embed_query, search_request.query)
        
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": search_request.threshold,
            "match_count": search_request.limit,
            "query_text": search_request.query,
            "search_mode": search_request.mode,
        }

        logger.debug(f"Executing RPC match_videos with query: {search_request.query}")

        response = supabase.rpc("match_videos", rpc_params).execute()

        # No post-filtering here on purpose. match_threshold applies to the vector
        # branch inside the RPC; re-applying it in Python would discard every
        # full-text match and collapse the hybrid search back into a vector-only
        # one. The RPC already honours match_count exactly.
        results = response.data or []

        logger.info(f"Search returned {len(results)} results")
        return results

    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred during search. Please try again."
        )


def _run_branches(query_vector: list[float], search_request: SearchRequest) -> tuple[list, list, list]:
    base = {
        "query_embedding": query_vector,
        "query_text": search_request.query,
        "match_count": min(max(search_request.limit, MIN_BRANCH_ROWS), MAX_BRANCH_ROWS),
    }

    # Threshold zeroed on purpose. It filters the vector branch without
    # reordering it, so leaving it on would renumber the ranks that RRF
    # actually used and the arithmetic shown to the user would not add up.
    semantic = supabase.rpc(
        "match_videos", {**base, "match_threshold": 0.0, "search_mode": "semantic"}
    ).execute().data or []

    text = supabase.rpc(
        "match_videos", {**base, "match_threshold": 0.0, "search_mode": "text"}
    ).execute().data or []

    fused = supabase.rpc(
        "match_videos",
        {
            **base,
            "match_count": search_request.limit,
            "match_threshold": search_request.threshold,
            "search_mode": search_request.mode,
        },
    ).execute().data or []

    return semantic, text, fused


@router.post("/search/explain", response_model=SearchExplain)
@limiter.limit("10/minute")
async def explain_search(request: Request, search_request: SearchRequest):
    logger.info(f"Explain requested: '{search_request.query}' (mode: {search_request.mode})")

    try:
        loop = asyncio.get_event_loop()
        query_vector = await loop.run_in_executor(None, embed_query, search_request.query)

        semantic, text, fused = await loop.run_in_executor(
            None, _run_branches, query_vector, search_request
        )

        # A branch only earns a position on the fused row when that mode
        # actually fused it in. Reporting a rank the score never used would
        # print arithmetic that does not add up to the total beside it.
        scored_semantic = search_request.mode in ("hybrid", "semantic")
        scored_text = search_request.mode in ("hybrid", "text")

        semantic_positions = (
            {row["id"]: i + 1 for i, row in enumerate(semantic)} if scored_semantic else {}
        )
        text_positions = (
            {row["id"]: i + 1 for i, row in enumerate(text)} if scored_text else {}
        )

        def contribution(position: int | None) -> float:
            return 1.0 / (RRF_K + position) if position else 0.0

        return SearchExplain(
            query=search_request.query,
            mode=search_request.mode,
            threshold=search_request.threshold,
            rrf_k=RRF_K,
            semantic=[
                RankedEntry(
                    id=row["id"],
                    titulo_video=row["titulo_video"],
                    position=i + 1,
                    value=row.get("similarity") or 0.0,
                )
                for i, row in enumerate(semantic)
            ],
            text=[
                RankedEntry(
                    id=row["id"],
                    titulo_video=row["titulo_video"],
                    position=i + 1,
                    value=row.get("text_rank") or 0.0,
                )
                for i, row in enumerate(text)
            ],
            fused=[
                FusionRow(
                    id=row["id"],
                    titulo_video=row["titulo_video"],
                    url_original=row["url_original"],
                    position=i + 1,
                    score=row.get("score") or 0.0,
                    similarity=row.get("similarity") or 0.0,
                    text_rank=row.get("text_rank") or 0.0,
                    semantic_position=semantic_positions.get(row["id"]),
                    semantic_contribution=contribution(semantic_positions.get(row["id"])),
                    text_position=text_positions.get(row["id"]),
                    text_contribution=contribution(text_positions.get(row["id"])),
                )
                for i, row in enumerate(fused)
            ],
        )

    except Exception as e:
        logger.exception(f"Explain failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while explaining the search. Please try again."
        )
