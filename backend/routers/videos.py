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
    analyze_scenes: bool = False
    analyze_audio: bool = False
    
    @field_validator('url')
    @classmethod
    def validate_url_domain(cls, v: str) -> str:
        if not validate_video_url(v):
            raise ValueError('URL must be from twitter.com, x.com, youtube.com, or youtu.be')
        return v


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_from_url(request: Request, body: VideoAnalysisRequest):
    logger.info(f"Analysis requested for URL: {body.url} (Scenes: {body.analyze_scenes}, Audio: {body.analyze_audio})")
    video_path = None

    try:
        loop = asyncio.get_event_loop()
        video_path = await loop.run_in_executor(None, download_video, body.url)
        
        analysis_result = await analyze_video_content(video_path, body.analyze_scenes, body.analyze_audio)
        
        if not analysis_result:
            raise HTTPException(status_code=500, detail="Failed to analyze video content")
            
        if "metadados_estruturados" not in analysis_result:
            analysis_result["metadados_estruturados"] = {}
        
        analysis_result["url_original"] = body.url
        
        try:
            dto = VideoMetadataDTO(**analysis_result)
            return dto.model_dump()
        except ValueError as e:
            logger.error(f"Validation error parsing AI output: {e}\nRaw output: {analysis_result}")
            raise HTTPException(status_code=500, detail="Internal AI schema validation failed")
    
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
@limiter.limit("10/minute")
async def save_video(request: Request, metadata: VideoMetadataDTO):
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
