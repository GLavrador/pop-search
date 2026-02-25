from pydantic import BaseModel, Field
from typing import List, Optional


class Pessoa(BaseModel):
    descricao: str = Field(..., min_length=3, max_length=500, description="Physical description")
    papel: Optional[str] = Field(None, max_length=100, description="Role in video if identifiable")


class AudioInfo(BaseModel):
    transcricao: str = Field("", max_length=5000, description="Transcribed speech or lyrics")
    musica: Optional[str] = Field(None, max_length=200, description="Song name if identified")
    artista: Optional[str] = Field(None, max_length=200, description="Artist name if identified")


class MetadadosEstruturados(BaseModel):
    pessoas: List[Pessoa] = Field(default_factory=list, max_length=20)
    elementos_cenario: List[str] = Field(default_factory=list, max_length=50)
    audio: AudioInfo = Field(default_factory=AudioInfo)


class VideoMetadataDTO(BaseModel):
    titulo_sugerido: str = Field(
        ..., 
        min_length=5, 
        max_length=200, 
        description="Descriptive title for the video"
    )
    descricao_completa: str = Field(
        ..., 
        min_length=20, 
        max_length=5000, 
        description="Complete detailed description"
    )
    url_original: Optional[str] = Field(
        None, 
        max_length=2048, 
        description="Original video URL"
    )
    metadados_estruturados: MetadadosEstruturados


class SearchRequest(BaseModel):
    query: str = Field(
        ..., 
        min_length=2, 
        max_length=500, 
        description="Search query text"
    )
    limit: int = Field(5, ge=1, le=50, description="Maximum results to return")
    threshold: float = Field(0.5, ge=0.0, le=1.0, description="Similarity threshold")


class SearchResult(BaseModel):
    id: str
    titulo_video: str
    descricao_completa: Optional[str] = None
    resumo: Optional[str] = None  # Backward compatibility
    url_original: str
    similarity: float = Field(..., ge=0.0, le=1.0)

