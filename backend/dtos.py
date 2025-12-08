from pydantic import BaseModel
from typing import List, Optional

class VisualMetadata(BaseModel):
    pessoas: List[str]
    elementos_cenario: List[str]
    contexto: str

class AudioMetadata(BaseModel):
    transcricao_trecho: str
    musica_identificada: Optional[str] = None
    artista: Optional[str] = None

class VideoMetadataDTO(BaseModel):
    titulo_sugerido: str
    resumo: str
    url_original: Optional[str] = None
    metadados_visuais: VisualMetadata
    metadados_audio: AudioMetadata
    tags_busca: List[str]
    sentimento: str
    
class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.5 

class SearchResult(BaseModel):
    id: str
    titulo_video: str
    resumo: str
    similarity: float