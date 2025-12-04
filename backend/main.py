from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel 
from contextlib import asynccontextmanager
from db import supabase
from services.ai import analyze_video_content
from services.downloader import download_video
from core.logger import configure_logging, get_logger
import shutil
import os

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

class VideoAnalysisRequest(BaseModel):
    url: str

@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "version": "0.1.0"
    }

@app.post("/analyze")
async def analyze_from_url(request: VideoAnalysisRequest):
  
    logger.info(f"Analysis requested for URL: {request.url}")
    video_path = None

    try:
        video_path = download_video(request.url)
        
        analysis_result = await analyze_video_content(video_path)
        
        if not analysis_result:
            raise HTTPException(status_code=500, detail="Failed to analyze video content")
        
        analysis_result["url_original"] = request.url
        
        return analysis_result

    except Exception as e:
        logger.exception("Error processing video flow")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
            logger.debug(f"Cleaned up temp file: {video_path}")