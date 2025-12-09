import os
import json
import asyncio
import time
import google.generativeai as genai
from dotenv import load_dotenv
from core.logger import get_logger

logger = get_logger("services.ai")

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.critical("GEMINI_API_KEY missing in environment variables")
    raise ValueError("GEMINI_API_KEY not found in .env")

genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash"

generation_config = {
  "temperature": 0.2,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 65536,
  "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
  model_name=MODEL_NAME,
  generation_config=generation_config,
)

SYSTEM_PROMPT = """
Você é um analista de vídeos especialista em extração de metadados para indexação. 
Atue com duas personalidades simultâneas:
1. DETETIVE VISUAL: Identifique celebridades, cenários e contexto visualmente.
2. ESTENÓGRAFA DE ÁUDIO: Transcreva trechos da letra e identifique músicas com precisão.

REGRAS RÍGIDAS:
- Se a música não for óbvia ou citada, retorne 'musica_identificada': null. NÃO ALUCINE.
- Priorize transcrever o refrão ou trechos marcantes no 'transcricao_trecho'.
- Analise o sentimento geral do conteúdo.

Retorne APENAS um JSON seguindo estritamente este schema:
{
  "titulo_sugerido": "Um título curto e descritivo para o vídeo",
  "resumo": "Resumo de 1 ou 2 frases sobre o que acontece",
  "metadados_visuais": {
      "pessoas": ["Lista de nomes de pessoas famosas ou descrições genéricas se desconhecidas"],
      "elementos_cenario": ["Lista de objetos ou locais visíveis importantes"],
      "contexto": "Descrição do contexto visual (ex: show, entrevista, meme, notícia)"
  },
  "metadados_audio": {
      "transcricao_trecho": "Trecho falado ou cantado mais relevante",
      "musica_identificada": "Nome da música (ou null)",
      "artista": "Nome do artista (ou null)"
  },
  "tags_busca": ["5 a 10 tags relevantes para busca futura"],
  "sentimento": "Positivo, Negativo, Neutro, Humorístico, Tenso, etc."
}
"""

TIMEOUT = 60 

async def analyze_video_content(video_path: str):
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
        
        response = await asyncio.wait_for(
            model.generate_content_async([SYSTEM_PROMPT, video_file]),
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