import os
import asyncio
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from services.embedding import create_embedding
from services.ai import analyze_video_content
from services.downloader import download_video
from dtos import VideoMetadataDTO
from db import supabase
from core.logger import get_logger
from core.limiter import limiter
from core.exceptions import validate_video_url
from asyncio import TimeoutError as AsyncTimeoutError

logger = get_logger("routers.videos")

router = APIRouter(prefix="/videos", tags=["Videos"])


class VideoAnalysisRequest(BaseModel):
    url: str
    
    @field_validator('url')
    @classmethod
    def validate_url_domain(cls, v: str) -> str:
        if not validate_video_url(v):
            raise ValueError('URL must be from twitter.com, x.com, youtube.com, or youtu.be')
        return v


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_from_url(request: Request, body: VideoAnalysisRequest):
    logger.info(f"Analysis requested for URL: {body.url}")
    video_path = None

    try:
        loop = asyncio.get_event_loop()
        video_path = await loop.run_in_executor(None, download_video, body.url)
        
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
        logger.exception(f"Error processing video flow: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An internal error occurred while processing the video. Please try again."
        )
        
    finally:
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
            logger.debug(f"Cleaned up temp file: {video_path}")


@router.post("")
async def save_video(metadata: VideoMetadataDTO):
    logger.info(f"Save request received for video: {metadata.titulo_sugerido}")
    
    if not metadata.url_original:
        raise HTTPException(status_code=400, detail="url_original is required for saving")

    try:
        loop = asyncio.get_event_loop()
        vector = await loop.run_in_executor(None, create_embedding, metadata)
        
        db_payload = {
            "titulo_video": metadata.titulo_sugerido,
            "descricao_completa": metadata.descricao_completa,
            "url_original": metadata.url_original,
            "metadados_estruturados": metadata.metadados_estruturados.model_dump(),
            "embedding": vector
        }
        
        logger.info("Persisting to Supabase...")
        data, count = supabase.table("videos").insert(db_payload).execute()
        
        logger.info(f"Video saved successfully. ID: {data[1][0]['id']}")
        
        return {
            "status": "success", 
            "id": data[1][0]['id'],
            "message": "Video indexed successfully"
        }

    except Exception as e:
        logger.exception(f"Failed to save video: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An internal error occurred while saving the video. Please try again."
        )
