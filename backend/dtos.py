from pydantic import BaseModel
from typing import List, Optional

class Pessoa(BaseModel):
    descricao: str
    papel: Optional[str] = None

class AudioInfo(BaseModel):
    transcricao: str = ""
    musica: Optional[str] = None
    artista: Optional[str] = None

class MetadadosEstruturados(BaseModel):
    pessoas: List[Pessoa] = []
    elementos_cenario: List[str] = []
    audio: AudioInfo = AudioInfo()
    tags_busca: List[str] = []

class VideoMetadataDTO(BaseModel):
    titulo_sugerido: str
    descricao_completa: str
    url_original: Optional[str] = None
    metadados_estruturados: MetadadosEstruturados
    
class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.5 

class SearchResult(BaseModel):
    id: str
    titulo_video: str
    descricao_completa: Optional[str] = None
    resumo: Optional[str] = None  
    url_original: str
    similarity: float
