import os
import google.generativeai as genai
from dotenv import load_dotenv
from core.logger import get_logger

logger = get_logger("core.gemini")

load_dotenv()

_configured = False

EMBEDDING_MODEL = "models/gemini-embedding-001"
GENERATION_MODEL = "gemini-2.5-flash"

GENERATION_CONFIG = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 65536,
    "response_mime_type": "application/json",
}


def _ensure_configured() -> None:
    global _configured
    
    if _configured:
        return
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.critical("GEMINI_API_KEY missing in environment variables")
        raise ValueError("GEMINI_API_KEY not found in environment")
    
    genai.configure(api_key=api_key)
    _configured = True
    logger.debug("Gemini API configured successfully")


def get_genai():
    _ensure_configured()
    return genai


def get_generation_model():
    _ensure_configured()
    return genai.GenerativeModel(
        model_name=GENERATION_MODEL,
        generation_config=GENERATION_CONFIG,
    )


def create_embedding(text: str, task_type: str = "retrieval_document") -> list[float]:

    _ensure_configured()
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type=task_type
    )
    return result['embedding']
