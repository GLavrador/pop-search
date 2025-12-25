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
        f"Description: {data.descricao_completa}",
    ]
    
    meta = data.metadados_estruturados
    
    if meta.pessoas:
        pessoas_text = ", ".join(p.descricao for p in meta.pessoas)
        parts.append(f"People: {pessoas_text}")
    
    if meta.elementos_cenario:
        parts.append(f"Elements: {', '.join(meta.elementos_cenario)}")
    
    if meta.audio and meta.audio.transcricao:
        parts.append(f"Audio: {meta.audio.transcricao}")
    
    if meta.tags_busca:
        parts.append(f"Keywords: {', '.join(meta.tags_busca)}")
    
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
    
def embed_query(text: str) -> list[float]:
    try:
        logger.debug(f"Embedding query text: {text[:50]}...")
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_query" 
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Failed to embed query: {e}")
        raise e