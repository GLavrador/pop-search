from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel 
from contextlib import asynccontextmanager
from services.embedding import create_embedding
from dtos import VideoMetadataDTO
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