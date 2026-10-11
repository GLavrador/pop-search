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
    MAX_MUSICA_CHARS,
    MAX_PAPEL_CHARS,
    MAX_PESSOA_DESCRICAO_CHARS,
    MAX_PESSOAS,
    MAX_TITULO_CHARS,
    MAX_TRANSCRICAO_CHARS,
    MIN_PESSOA_DESCRICAO_CHARS,
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

    # Same keys, in the same order, as get_response_schema: the API answers
    # alphabetically, and a prompt that asks for a key the schema leaves out
    # makes the model write without end.
    prompt_parts.append("\n## SCHEMA DO JSON DE SAÍDA:\n{")
    prompt_parts.append('  "descricao_completa": "Descrição detalhada (mínimo 2 frases)",')

    meta_keys = []
    if analyze_audio:
        meta_keys.append('    "audio": {\n      "artista": null,\n      "musica": null,\n      "transcricao": "Falas transcritas"\n    }')
    if analyze_scenes:
        meta_keys.append('    "elementos_cenario": ["objeto 1"],\n    "pessoas": [{"descricao": "Descrição física detalhada", "papel": "Papel ou null"}]')

    if meta_keys:
        prompt_parts.append('  "metadados_estruturados": {')
        prompt_parts.append(",\n".join(meta_keys))
        prompt_parts.append("  },")

    prompt_parts.append(f'  "titulo_sugerido": "Título (max {MAX_TITULO_CHARS} caracteres)"\n}}')

    return "\n".join(prompt_parts)


def get_response_schema(analyze_scenes: bool, analyze_audio: bool) -> dict:
    """The shape Gemini is held to. It cannot cap the length of a string, so the
    limits stay in the prompt and fit_to_limits cuts whatever still runs over."""
    text = {"type": "STRING"}
    optional_text = {"type": "STRING", "nullable": True}
    sections: dict = {}

    if analyze_scenes:
        sections["pessoas"] = {
            "type": "ARRAY",
            "max_items": MAX_PESSOAS,
            "items": {
                "type": "OBJECT",
                "properties": {"descricao": text, "papel": optional_text},
                "required": ["descricao"],
            },
        }
        sections["elementos_cenario"] = {
            "type": "ARRAY",
            "max_items": MAX_ELEMENTOS_CENARIO,
            "items": text,
        }

    if analyze_audio:
        sections["audio"] = {
            "type": "OBJECT",
            "properties": {"transcricao": text, "musica": optional_text, "artista": optional_text},
            "required": ["transcricao"],
        }

    properties: dict = {"titulo_sugerido": text, "descricao_completa": text}

    # An object with no properties is rejected, so the key is left out instead.
    if sections:
        properties["metadados_estruturados"] = {
            "type": "OBJECT",
            "properties": sections,
            "required": list(sections),
        }

    return {"type": "OBJECT", "properties": properties, "required": list(properties)}


def _cut(text, limit: int):
    if not isinstance(text, str) or len(text) <= limit:
        return text

    cut = text[:limit]
    if not text[limit].isspace() and " " in cut:
        cut = cut.rsplit(None, 1)[0]
    return cut.rstrip()


def fit_to_limits(result: dict) -> dict:
    """Cuts what ran past a limit, so a paid analysis is not thrown away over a
    title a few characters too long."""
    fitted = dict(result)
    fitted["titulo_sugerido"] = _cut(result.get("titulo_sugerido"), MAX_TITULO_CHARS)
    fitted["descricao_completa"] = _cut(result.get("descricao_completa"), MAX_DESCRICAO_CHARS)

    meta = result.get("metadados_estruturados")
    if not isinstance(meta, dict):
        return fitted
    meta = dict(meta)

    if isinstance(meta.get("pessoas"), list):
        people = [
            {
                **person,
                "descricao": _cut(person["descricao"].strip(), MAX_PESSOA_DESCRICAO_CHARS),
                "papel": _cut(person.get("papel"), MAX_PAPEL_CHARS),
            }
            for person in meta["pessoas"]
            if isinstance(person, dict) and isinstance(person.get("descricao"), str)
        ]
        meta["pessoas"] = [
            person for person in people if len(person["descricao"]) >= MIN_PESSOA_DESCRICAO_CHARS
        ][:MAX_PESSOAS]

    if isinstance(meta.get("elementos_cenario"), list):
        meta["elementos_cenario"] = [
            item for item in meta["elementos_cenario"] if isinstance(item, str)
        ][:MAX_ELEMENTOS_CENARIO]

    audio = meta.get("audio")
    if isinstance(audio, dict):
        meta["audio"] = {
            **audio,
            "transcricao": _cut(audio.get("transcricao") or "", MAX_TRANSCRICAO_CHARS),
            "musica": _cut(audio.get("musica"), MAX_MUSICA_CHARS),
            "artista": _cut(audio.get("artista"), MAX_MUSICA_CHARS),
        }

    fitted["metadados_estruturados"] = meta
    return fitted


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
            model.generate_content_async(
                [system_prompt, video_file],
                generation_config={
                    "response_schema": get_response_schema(analyze_scenes, analyze_audio)
                },
            ),
            timeout=GENERATION_TIMEOUT
        )
    
        _log_token_usage(response, usage)

        result = _extract_json(response)
        if not isinstance(result, dict):
            logger.error(f"Gemini answered with {type(result).__name__} instead of an object")
            return None

        logger.info("Analysis received successfully")
        return fit_to_limits(result)

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
