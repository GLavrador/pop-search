import os
import uuid
import yt_dlp
from core.logger import get_logger

logger = get_logger("services.downloader")

DOWNLOAD_DIR = "temp_downloads"

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def download_video(url: str) -> str:
    video_id = str(uuid.uuid4())
    output_template = os.path.join(DOWNLOAD_DIR, f"{video_id}.%(ext)s")
    
    logger.info(f"Starting download for URL: {url}")

    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': output_template,
        'quiet': True, 
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            logger.debug(f"Video title detected: {info.get('title', 'Unknown')}")

            ydl.download([url])
            
            for file in os.listdir(DOWNLOAD_DIR):
                if file.startswith(video_id):
                    final_path = os.path.join(DOWNLOAD_DIR, file)
                    logger.info(f"Download finished successfully: {final_path}")
                    return final_path
            
            raise FileNotFoundError("Download finished but file not found.")

    except Exception as e:
        logger.error(f"Failed to download video: {e}")
        raise e