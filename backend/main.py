from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from pydantic import BaseModel 
from contextlib import asynccontextmanager
from services.embedding import create_embedding
from dtos import VideoMetadataDTO, SearchRequest, SearchResult
from db import supabase
from services.ai import analyze_video_content
from services.downloader import download_video
from core.logger import configure_logging, get_logger
import shutil
import os
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded 
from core.limiter import limiter 
from asyncio import TimeoutError as AsyncTimeoutError

configure_logging()
logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Pop Search API starting up...")
    yield
    logger.info("Pop Search API shutting down...")

app = FastAPI(
    title="Pop Search API",
    version="0.1.0",
    lifespan=lifespan
)

app = FastAPI(title="Pop Search API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class VideoAnalysisRequest(BaseModel):
    url: str

@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "version": "0.1.0"
    }

@app.post("/analyze")
@limiter.limit("5/minute")
async def analyze_from_url(request: Request, body: VideoAnalysisRequest):
  
    logger.info(f"Analysis requested for URL: {body.url}")
    video_path = None

    try:
        video_path = download_video(body.url)
        
        analysis_result = await analyze_video_content(video_path)
        
        if not analysis_result:
            raise HTTPException(status_code=500, detail="Failed to analyze video content")
        
        analysis_result["url_original"] = body.url
        
        return analysis_result
    
    except AsyncTimeoutError:
        logger.error("Request timed out waiting for AI")
        raise HTTPException(
            status_code=504, 
            detail="The AI service took too long to respond. Please try again later."
        )

    except HTTPException as he:
        raise he

    except Exception as e:
        logger.exception("Error processing video flow")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
            logger.debug(f"Cleaned up temp file: {video_path}")
            
@app.post("/videos")
async def save_video(metadata: VideoMetadataDTO):
    logger.info(f"Save request received for video: {metadata.titulo_sugerido}")
    
    if not metadata.url_original:
        raise HTTPException(status_code=400, detail="url_original is required for saving")

    try:
        vector = create_embedding(metadata)
        db_payload = metadata.model_dump()
        if "titulo_sugerido" in db_payload:
            db_payload["titulo_video"] = db_payload.pop("titulo_sugerido")
        db_payload["embedding"] = vector
        
        logger.info("Persisting to Supabase...")
        data, count = supabase.table("videos").insert(db_payload).execute()
        
        logger.info(f"Video saved successfully. ID: {data[1][0]['id']}")
        
        return {
            "status": "success", 
            "id": data[1][0]['id'],
            "message": "Video indexed successfully"
        }

    except Exception as e:
        logger.exception("Failed to save video")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/search", response_model=list[SearchResult])
@limiter.limit("20/minute")
async def search_videos(request: Request, search_request: SearchRequest):
    logger.info(f"Search requested: '{search_request.query}'")
    
    try:
        from services.embedding import embed_query 
        
        query_vector = embed_query(search_request.query)
        
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": search_request.threshold, 
            "match_count": search_request.limit,         
            "query_text": search_request.query,
        }
        
        logger.debug(f"Executing RPC match_videos with query: {search_request.query}")
        
        response = supabase.rpc("match_videos", rpc_params).execute()
        results = response.data
        
        logger.info(f"Search returned {len(results)} results")
        return results

    except Exception as e:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail=str(e))