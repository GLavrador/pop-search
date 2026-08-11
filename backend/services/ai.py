import json
import asyncio
import time
from dataclasses import dataclass
from typing import Optional

from core.logger import get_logger
from core.gemini import get_genai, get_generation_model
from google.api_core.exceptions import ResourceExhausted

from core.exceptions import ContentBlockedError, ServiceQuotaExhaustedError
from dtos import (
    MAX_DESCRICAO_CHARS,
    MAX_ELEMENTOS_CENARIO,
    MAX_PESSOA_DESCRICAO_CHARS,
    MAX_PESSOAS,
    MAX_TITULO_CHARS,
    MAX_TRANSCRICAO_CHARS,
)

logger = get_logger("services.ai")

genai = get_genai()
model = get_generation_model()

PROCESSING_TIMEOUT = 60
GENERATION_TIMEOUT = 150
USABLE_FINISH_REASONS = {"STOP", "MAX_TOKENS"}


def get_system_prompt(analyze_scenes: bool, analyze_audio: bool) -> str:
    prompt_parts = [
        "Você é um especialista em análise de vídeos.",
        "Sua tarefa é retornar EXATAMENTE um JSON na estrutura solicitada.",
        "- Seja descritivo e objetivo.",
        "- NÃO invente músicas ou artistas.",
        "\n## LIMITES OBRIGATÓRIOS (respostas fora destes limites são descartadas):",
        f"- titulo_sugerido: no máximo {MAX_TITULO_CHARS} caracteres.",
        f"- descricao_completa: no máximo {MAX_DESCRICAO_CHARS} caracteres.",
    ]

    if analyze_scenes:
        prompt_parts.append(f"- pessoas: no máximo {MAX_PESSOAS} itens, cada descrição com até {MAX_PESSOA_DESCRICAO_CHARS} caracteres.")
        prompt_parts.append(f"- elementos_cenario: no máximo {MAX_ELEMENTOS_CENARIO} itens.")
    if analyze_audio:
        prompt_parts.append(f"- transcricao: no máximo {MAX_TRANSCRICAO_CHARS} caracteres.")

    prompt_parts.append("\n## INSTRUÇÕES:")
    prompt_parts.append("- Detalhe características físicas de PESSOAS e liste OBJETOS do cenário." if analyze_scenes else "- Ignore os detalhes das pessoas e objetos no cenário.")
    prompt_parts.append("- Transcreva as falas relevantes do áudio." if analyze_audio else "- Ignore o áudio do vídeo.")

    prompt_parts.append("\n## SCHEMA DO JSON DE SAÍDA:\n{")
    prompt_parts.append(f'  "titulo_sugerido": "Título (max {MAX_TITULO_CHARS} caracteres)",')
    prompt_parts.append('  "descricao_completa": "Descrição detalhada (mínimo 2 frases)",')
    prompt_parts.append('  "metadados_estruturados": {')

    meta_keys = []
    if analyze_scenes:
        meta_keys.append('    "pessoas": [{"descricao": "Descrição física detalhada", "papel": "Papel ou null"}],\n    "elementos_cenario": ["objeto 1"]')
    if analyze_audio:
        meta_keys.append('    "audio": {\n      "transcricao": "Falas transcritas",\n      "musica": null,\n      "artista": null\n    }')

    if meta_keys:
        prompt_parts.append(",\n".join(meta_keys))

    prompt_parts.append("  }\n}")
    
    return "\n".join(prompt_parts)


@dataclass
class TokenUsage:
    prompt: int = 0
    output: int = 0
    total: int = 0


def _log_token_usage(response, sink: Optional[TokenUsage] = None) -> None:
    """Record what the call actually cost.

    Logged at INFO rather than DEBUG because this is accounting data, not
    debugging: it is the only place the real cost of an analysis is visible,
    and it is the raw material for per-user metering later.
    """
    usage = getattr(response, "usage_metadata", None)

    if usage is None:
        logger.warning("Gemini response carried no usage_metadata; cost not recorded")
        return

    prompt = getattr(usage, "prompt_token_count", 0) or 0
    output = getattr(usage, "candidates_token_count", 0) or 0
    total = getattr(usage, "total_token_count", 0) or 0

    if sink is not None:
        sink.prompt, sink.output, sink.total = prompt, output, total

    logger.info(f"Gemini token usage: prompt={prompt} output={output} total={total}")


def _extract_json(response) -> dict:
    """Read the model output, refusing to touch .text when it would raise."""
    if not response.candidates:
        reason = getattr(getattr(response, "prompt_feedback", None), "block_reason", None)
        raise ContentBlockedError(str(reason) if reason else "NO_CANDIDATES")

    candidate = response.candidates[0]
    finish_reason = getattr(candidate.finish_reason, "name", str(candidate.finish_reason))

    if finish_reason not in USABLE_FINISH_REASONS:
        raise ContentBlockedError(finish_reason)

    return json.loads(response.text)


async def analyze_video_content(
    video_path: str,
    analyze_scenes: bool = False,
    analyze_audio: bool = False,
    usage: Optional[TokenUsage] = None,
):
    """`usage` is filled in place rather than returned, so the caller still gets
    the cost when the analysis raises."""
    video_file = None

    try:
        logger.info(f"Starting upload to Gemini: {video_path}")
        
        video_file = genai.upload_file(path=video_path)
        logger.debug(f"File uploaded. URI: {video_file.uri}")
        
        start_time = time.time()
        
        while video_file.state.name == "PROCESSING":
            elapsed = time.time() - start_time
            if elapsed > PROCESSING_TIMEOUT:
                logger.error(f"Timeout waiting for video processing ({elapsed:.1f}s)")
                raise asyncio.TimeoutError("Video processing on Gemini took too long.")
            
            logger.debug(f"Video still processing... ({elapsed:.1f}s)")
            
            await asyncio.sleep(2) 
            video_file = genai.get_file(video_file.name)

        if video_file.state.name == "FAILED":
            logger.error(f"Gemini processing failed state: {video_file.state.name}")
            raise ValueError("Video processing failed by Gemini internal error.")

        logger.info(f"Video active. Sending prompt (Timeout: {GENERATION_TIMEOUT}s)...")

        system_prompt = get_system_prompt(analyze_scenes, analyze_audio)
        
        response = await asyncio.wait_for(
            model.generate_content_async([system_prompt, video_file]),
            timeout=GENERATION_TIMEOUT
        )
    
        _log_token_usage(response, usage)

        result = _extract_json(response)
        logger.info("Analysis received successfully")
        return result

    except ResourceExhausted as e:
        logger.error(f"Gemini quota exhausted for the project: {e}")
        raise ServiceQuotaExhaustedError(str(e))

    except (asyncio.TimeoutError, ContentBlockedError) as e:
        logger.error(f"{type(e).__name__} in AI Service: {e}")
        raise e

    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from Gemini response")
        return None
    except Exception:
        logger.exception("Unexpected error during video analysis")
        return None

    finally:
        if video_file is not None:
            try:
                genai.delete_file(video_file.name)
                logger.debug(f"Deleted uploaded file from Gemini: {video_file.name}")
            except Exception as e:
                logger.warning(f"Failed to delete uploaded file from Gemini: {e}")
