import os
import google.generativeai as genai
from core.logger import get_logger
from dtos import VideoMetadataDTO

logger = get_logger("services.embedding")

if not genai.configure and os.getenv("GEMINI_API_KEY"):
     genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = "models/text-embedding-004"

def generate_searchable_text(data: VideoMetadataDTO) -> str:
    parts = [
        f"Title: {data.titulo_sugerido}",
        f"Summary: {data.resumo}",
        f"Visual Context: {data.metadados_visuais.contexto}",
        f"Elements: {', '.join(data.metadados_visuais.elementos_cenario)}",
        f"People: {', '.join(data.metadados_visuais.pessoas)}",
        f"Audio Transcript: {data.metadados_audio.transcricao_trecho}",
        f"Keywords: {', '.join(data.tags_busca)}"
    ]
    
    return "\n".join(parts)

def create_embedding(data: VideoMetadataDTO) -> list[float]:
    text_payload = generate_searchable_text(data)
    
    try:
        logger.info("Generating embedding for video metadata...")
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text_payload,
            task_type="retrieval_document" 
        )
        
        embedding = result['embedding']
        logger.debug(f"Embedding generated successfully. Dimensions: {len(embedding)}")
        return embedding

    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise e