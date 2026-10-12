from functools import lru_cache

from core.logger import get_logger
from core.gemini import get_genai, EMBEDDING_MODEL
from dtos import VideoMetadataDTO

logger = get_logger("services.embedding")

genai = get_genai()

# gemini-embedding-001 accepts at most 2048 input tokens and returns an error
# (rather than truncating) when that ceiling is exceeded. Counting tokens
# exactly would cost an extra API round trip per save, so we budget in
# characters instead: Portuguese runs roughly 3-4 characters per token, so
# staying under ~5000 characters keeps us below ~1700 tokens even in the
# worst case.
#
# The per-section budgets matter as much as the total: without them a single
# long transcript could consume the whole allowance and starve the title and
# description, which carry far more retrieval signal per character.
MAX_EMBEDDING_CHARS = 5000

DESCRIPTION_CHARS = 1800
POST_CHARS = 400
PEOPLE_CHARS = 700
ELEMENTS_CHARS = 500
AUDIO_CHARS = 1200


def _truncate(text: str, limit: int, section: str) -> str:
    if len(text) <= limit:
        return text

    logger.debug(f"Truncating '{section}' from {len(text)} to {limit} chars for embedding")
    return text[:limit].rstrip()


def generate_searchable_text(data: VideoMetadataDTO) -> str:
    parts = [
        f"Title: {data.titulo_sugerido}",
        f"Description: {_truncate(data.descricao_completa, DESCRIPTION_CHARS, 'description')}",
    ]

    if data.post and data.post.texto:
        parts.append(f"Post: {_truncate(data.post.texto, POST_CHARS, 'post')}")

    meta = data.metadados_estruturados

    if meta.pessoas:
        pessoas_text = ", ".join(p.descricao for p in meta.pessoas)
        parts.append(f"People: {_truncate(pessoas_text, PEOPLE_CHARS, 'people')}")

    if meta.elementos_cenario:
        elements_text = ", ".join(meta.elementos_cenario)
        parts.append(f"Elements: {_truncate(elements_text, ELEMENTS_CHARS, 'elements')}")

    if meta.audio and meta.audio.transcricao:
        parts.append(f"Audio: {_truncate(meta.audio.transcricao, AUDIO_CHARS, 'audio')}")

    payload = "\n".join(parts)

    # Backstop. The section budgets above already sum to less than this, so
    # reaching here means the sections drifted apart from the total budget.
    if len(payload) > MAX_EMBEDDING_CHARS:
        logger.warning(
            f"Searchable text still {len(payload)} chars after per-section limits; "
            f"hard-truncating to {MAX_EMBEDDING_CHARS}"
        )
        payload = payload[:MAX_EMBEDDING_CHARS].rstrip()

    return payload


def create_embedding(data: VideoMetadataDTO) -> list[float]:
    text_payload = generate_searchable_text(data)

    try:
        logger.info("Generating embedding for video metadata...")
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text_payload,
            task_type="retrieval_document",
            output_dimensionality=768
        )

        embedding = result['embedding']
        logger.debug(f"Embedding generated successfully. Dimensions: {len(embedding)}")
        return embedding

    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise e


QUERY_CACHE_SIZE = 256


# The same text always embeds to the same vector, and a search is repeated with
# every change of precision or mode. A failed call raises, so it is not kept.
@lru_cache(maxsize=QUERY_CACHE_SIZE)
def _embed_query(text: str) -> tuple[float, ...]:
    logger.debug(f"Embedding query text: {text[:50]}...")
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
        output_dimensionality=768
    )
    return tuple(result['embedding'])


# No truncation needed here: SearchRequest.query is already capped at 500
# characters by validation, well under the model's input limit.
def embed_query(text: str) -> list[float]:
    try:
        return list(_embed_query(" ".join(text.split())))
    except Exception as e:
        logger.error(f"Failed to embed query: {e}")
        raise e
