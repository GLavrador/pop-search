import json
import asyncio
import time
from core.logger import get_logger
from core.gemini import get_genai, get_generation_model

logger = get_logger("services.ai")

genai = get_genai()
model = get_generation_model()

def get_system_prompt(analyze_scenes: bool, analyze_audio: bool) -> str:
    prompt_parts = [
        "Você é um especialista em análise de vídeos.",
        "Sua tarefa é retornar EXATAMENTE um JSON na estrutura solicitada.",
        "- Seja descritivo e objetivo.",
        "- NÃO invente músicas ou artistas."
    ]

    prompt_parts.append("- Detalhe características físicas de PESSOAS e liste OBJETOS do cenário." if analyze_scenes else "- Ignore os detalhes das pessoas e objetos no cenário.")
    prompt_parts.append("- Transcreva as falas relevantes do áudio." if analyze_audio else "- Ignore o áudio do vídeo.")

    prompt_parts.append("\n## SCHEMA DO JSON DE SAÍDA:\n{")
    prompt_parts.append('  "titulo_sugerido": "Título (max 15 palavras)",')
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

TIMEOUT = 60 

async def analyze_video_content(video_path: str, analyze_scenes: bool = False, analyze_audio: bool = False):
    try:
        logger.info(f"Starting upload to Gemini: {video_path}")
        
        video_file = genai.upload_file(path=video_path)
        logger.debug(f"File uploaded. URI: {video_file.uri}")
        
        start_time = time.time()
        
        while video_file.state.name == "PROCESSING":
            elapsed = time.time() - start_time
            if elapsed > TIMEOUT:
                logger.error(f"Timeout waiting for video processing ({elapsed:.1f}s)")
                raise asyncio.TimeoutError("Video processing on Gemini took too long.")
            
            logger.debug(f"Video still processing... ({elapsed:.1f}s)")
            
            await asyncio.sleep(2) 
            video_file = genai.get_file(video_file.name)

        if video_file.state.name == "FAILED":
            logger.error(f"Gemini processing failed state: {video_file.state.name}")
            raise ValueError("Video processing failed by Gemini internal error.")

        logger.info(f"Video active. Sending prompt (Timeout: {TIMEOUT}s)...")
        
        system_prompt = get_system_prompt(analyze_scenes, analyze_audio)
        
        response = await asyncio.wait_for(
            model.generate_content_async([system_prompt, video_file]),
            timeout=TIMEOUT
        )
        
        logger.info("Analysis received successfully")
        return json.loads(response.text)

    except asyncio.TimeoutError as e:
        logger.error(f"Timeout Error in AI Service: {e}")
        raise e 

    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from Gemini response")
        return None
    except Exception as e:
        logger.exception("Unexpected error during video analysis")
        return None