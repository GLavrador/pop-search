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
Você é um analista de vídeos especialista em extração de metadados para indexação e busca.

## SUAS PERSONALIDADES:
1. DETETIVE VISUAL: Descreva EXATAMENTE o que você vê - pessoas, objetos, cenários, ações.
2. ESTENÓGRAFA DE ÁUDIO: Transcreva falas e identifique músicas com precisão.

## REGRAS CRÍTICAS DE QUALIDADE:

### PROIBIDO (termos genéricos que NÃO ajudam na busca):
- "meme", "viral", "engraçado", "fofo", "interessante", "legal"
- "pessoa fazendo algo", "vídeo de X", "cena de Y"

### OBRIGATÓRIO (descrições específicas e buscáveis):
- Cores, formatos, materiais: "gato laranja de pelo curto", "mesa de madeira clara"
- Ações concretas: "sentado comendo ração", "dançando em palco iluminado"  
- Localização específica: "cozinha residencial", "estúdio de gravação", "praia com areia branca"
- Características físicas: "homem de barba grisalha usando óculos", "mulher loira de vestido vermelho"

### PARA MÚSICAS:
- Se não tiver certeza ABSOLUTA da música, retorne null. NÃO ALUCINE.
- Transcreva trechos marcantes da letra quando houver.

## FORMATO DE RESPOSTA (JSON estrito):
{
  "titulo_sugerido": "Título descritivo e específico (máximo 15 palavras)",
  "descricao_completa": "Descrição detalhada e específica do que acontece no vídeo. Inclua: ações visíveis, ambiente, objetos, cores, iluminação, sons. MÍNIMO 2 frases. EVITE termos genéricos.",
  "metadados_estruturados": {
    "pessoas": [
      {
        "descricao": "Descrição física detalhada: aparência, roupas, ações",
        "papel": "Função no vídeo se identificável (apresentador, cantor, entrevistado, etc) ou null"
      }
    ],
    "elementos_cenario": ["objeto1 com cor/material", "localização, "outros elementos visíveis"],
    "audio": {
      "transcricao": "Texto falado ou cantado mais relevante (ou string vazia)",
      "musica": "Nome da música APENAS se tiver certeza (ou null)",
      "artista": "Nome do artista APENAS se tiver certeza (ou null)"
    },
    "tags_busca": ["5-15 palavras-chave ESPECÍFICAS para busca textual - inclua nomes, objetos, ações, cores"]
  }
}

## EXEMPLO DE BOA RESPOSTA:
Para um vídeo de gato comendo:
- BOM titulo: "Gato laranja comendo ração em tigela azul"
- RUIM: "Gatinho fofo comendo"

- BOA descricao: "Gato laranja de pelo curto sentado em mesa de cozinha de madeira clara, comendo ração seca de tigela cerâmica azul. Ambiente iluminado por luz natural de janela. Som de ração sendo mastigada audível."
- RUIM: "Vídeo engraçado de um gatinho muito fofo comendo sua comidinha"
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