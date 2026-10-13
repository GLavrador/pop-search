from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Optional

from core.exceptions import validate_image_url

MAX_TITULO_CHARS = 200
MAX_DESCRICAO_CHARS = 5000
MAX_PESSOAS = 20
MAX_PESSOA_DESCRICAO_CHARS = 500
MIN_PESSOA_DESCRICAO_CHARS = 3
MAX_PAPEL_CHARS = 100
MAX_ELEMENTOS_CENARIO = 50
MAX_TRANSCRICAO_CHARS = 5000
MAX_MUSICA_CHARS = 200
MAX_POST_TEXTO_CHARS = 2000


class PostInfo(BaseModel):
    """What is kept of the post a video came from. Who posted it is not."""
    texto: str = Field("", max_length=MAX_POST_TEXTO_CHARS, description="Text the author wrote")
    miniatura: Optional[str] = Field(None, max_length=2048, description="Thumbnail of the video")

    @field_validator("texto")
    @classmethod
    def trimmed(cls, v: str) -> str:
        return v.strip()

    # Dropped rather than refused: a post without its picture is still a post.
    @field_validator("miniatura")
    @classmethod
    def only_from_x(cls, v: Optional[str]) -> Optional[str]:
        return v if v and validate_image_url(v) else None

    def to_store(self) -> Optional[dict]:
        """Nothing at all, rather than an empty post, when neither is there."""
        return self.model_dump() if self.texto or self.miniatura else None


class Pessoa(BaseModel):
    descricao: str = Field(..., min_length=MIN_PESSOA_DESCRICAO_CHARS, max_length=MAX_PESSOA_DESCRICAO_CHARS, description="Physical description")
    papel: Optional[str] = Field(None, max_length=MAX_PAPEL_CHARS, description="Role in video if identifiable")


class AudioInfo(BaseModel):
    transcricao: str = Field("", max_length=MAX_TRANSCRICAO_CHARS, description="Transcribed speech or lyrics")
    musica: Optional[str] = Field(None, max_length=MAX_MUSICA_CHARS, description="Song name if identified")
    artista: Optional[str] = Field(None, max_length=MAX_MUSICA_CHARS, description="Artist name if identified")


class MetadadosEstruturados(BaseModel):
    pessoas: List[Pessoa] = Field(default_factory=list, max_length=MAX_PESSOAS)
    elementos_cenario: List[str] = Field(default_factory=list, max_length=MAX_ELEMENTOS_CENARIO)
    audio: AudioInfo = Field(default_factory=AudioInfo)


class VideoMetadataDTO(BaseModel):
    titulo_sugerido: str = Field(
        ..., 
        min_length=5, 
        max_length=MAX_TITULO_CHARS,
        description="Descriptive title for the video"
    )
    descricao_completa: str = Field(
        ..., 
        min_length=20, 
        max_length=MAX_DESCRICAO_CHARS,
        description="Complete detailed description"
    )
    url_original: Optional[str] = Field(
        None, 
        max_length=2048, 
        description="Original video URL"
    )
    metadados_estruturados: MetadadosEstruturados
    post: Optional[PostInfo] = None


SearchMode = Literal["hybrid", "semantic", "text"]


class SearchRequest(BaseModel):
    query: str = Field(
        ..., 
        min_length=2, 
        max_length=500, 
        description="Search query text"
    )
    limit: int = Field(5, ge=1, le=50, description="Maximum results to return")
    threshold: float = Field(0.60, ge=0.0, le=1.0, description="Similarity threshold. Applies to the vector branch only.")
    mode: SearchMode = Field("hybrid", description="hybrid = vector + full-text fused via RRF; semantic = vector only; text = full-text only",)


class QuotaStatus(BaseModel):
    used: int
    limit: int
    remaining: int
    resets_at: str
    tokens_this_month: int = 0


class UserUsageRow(BaseModel):
    user_id: str
    display_name: str
    analyses: int
    tokens: int
    limit: int


class FailureReason(BaseModel):
    reason: str
    count: int


class DailyPoint(BaseModel):
    date: str
    analyses: int
    tokens: int


class AdminStatsReport(BaseModel):
    range_days: int
    analyses: int
    saves: int
    tokens: int
    avg_tokens: int
    median_tokens: int
    min_tokens: int
    max_tokens: int
    measured: int
    failures: int
    failure_rate: float
    tokens_wasted: int
    failures_by_reason: List[FailureReason]
    daily: List[DailyPoint]
    analyses_today: int
    daily_limit: int
    projected_tokens_at_limit: int
    per_user: List["UserUsageRow"]


class ProjectUsageReport(BaseModel):
    rows: List[UserUsageRow]
    analyses_today: int
    daily_limit: int


class MyVideo(BaseModel):
    id: str
    titulo_video: Optional[str] = None
    descricao_completa: Optional[str] = None
    url_original: str
    created_at: str
    post: Optional[PostInfo] = None
    # As stored, unchecked: a video saved under older limits must still be listed.
    metadados_estruturados: Optional[dict] = None


AnalysisStage = Literal["queued", "downloading", "uploading", "watching", "writing", "done", "failed"]


class AnalysisError(BaseModel):
    status: int
    detail: str


class AnalysisJob(BaseModel):
    id: str
    url: str
    stage: AnalysisStage
    analyze_scenes: bool
    analyze_audio: bool
    result: Optional[VideoMetadataDTO] = None
    error: Optional[AnalysisError] = None
    created_at: str


class ExistingVideo(BaseModel):
    id: str
    titulo_video: Optional[str] = None
    url_original: str
    created_at: str


class SearchResult(BaseModel):
    id: str
    titulo_video: str
    descricao_completa: Optional[str] = None
    url_original: str
    # Cosine similarity lives in [-1, 1]. It is 0.0 for results that came in
    # through the full-text branch alone
    similarity: float = Field(..., ge=-1.0, le=1.0)
    text_rank: float = Field(0.0, description="ts_rank_cd score, 0.0 if no text match")
    score: float = Field(0.0, description="Fused RRF score used for ordering")
    post: Optional[PostInfo] = None
    # Why the row is there. All of it is missing while the database still runs
    # the match_videos from before these columns.
    vector_position: Optional[int] = Field(None, description="Place in the list by meaning, 1 on top")
    text_position: Optional[int] = Field(None, description="Place in the list by words, 1 on top")
    fusion_k: Optional[int] = Field(None, description="The k of the fusion: score = sum of 1 / (k + place)")
    matched: Optional[str] = Field(None, description="Excerpt with the words that matched between << and >>")


class DatabaseStatus(BaseModel):
    ok: bool
    ms: Optional[float] = None
    videos: Optional[int] = None


class AiStatus(BaseModel):
    analysis_model: str
    embedding_model: str
    dimensions: int
    questions_kept: int
    questions_room: int


class SystemReport(BaseModel):
    """What the server is made of and how it is doing, for anyone to read."""
    version: str
    uptime_seconds: int
    python: str
    framework: str
    downloader: str
    database: DatabaseStatus
    ai: AiStatus

