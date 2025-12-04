from fastapi import FastAPI, UploadFile, File, HTTPException
from contextlib import asynccontextmanager
from db import supabase
from services.ai import analyze_video_content
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

@app.get("/")
async def health_check():
    logger.debug("Health check requested")
    try:
        response = supabase.table("videos").select("count", count="exact").execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Database connection failed: {e}")

    return {
        "status": "ok",
        "database": db_status,
        "version": "0.1.0"
    }

@app.post("/test-ai-analysis")
async def test_ai_analysis(file: UploadFile = File(...)):
   
    temp_filename = f"temp_{file.filename}"
    logger.info(f"Received request to analyze file: {file.filename}")
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.debug(f"Temporary file saved: {temp_filename}")
            
        result = await analyze_video_content(temp_filename)
        
        if not result:
            logger.error("Service returned None result")
            raise HTTPException(status_code=500, detail="AI Analysis failed")
            
        logger.info("Returning successful analysis to client")
        return result

    except Exception as e:
        logger.exception("Critical error in /test-ai-analysis")
        raise e
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            logger.debug(f"Cleaned up temporary file: {temp_filename}")