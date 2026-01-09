import os
import uuid
import yt_dlp
from contextlib import contextmanager
from core.logger import get_logger

logger = get_logger("services.downloader")

DOWNLOAD_DIR = "temp_downloads"
MAX_FILESIZE_MB = 100 
SOCKET_TIMEOUT = 30

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)


def download_video(url: str) -> str:
    video_id = str(uuid.uuid4())
    output_template = os.path.join(DOWNLOAD_DIR, f"{video_id}.%(ext)s")
    
    logger.info(f"Starting download for URL: {url}")

    ydl_opts = {
        'format': f'best[ext=mp4][filesize<{MAX_FILESIZE_MB}M]/best[ext=mp4]/best',
        'outtmpl': output_template,
        'quiet': True, 
        'no_warnings': True,
        'socket_timeout': SOCKET_TIMEOUT,
        'max_filesize': MAX_FILESIZE_MB * 1024 * 1024,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            filesize = info.get('filesize') or info.get('filesize_approx')
            if filesize and filesize > MAX_FILESIZE_MB * 1024 * 1024:
                raise ValueError(f"Video file size ({filesize / 1024 / 1024:.1f}MB) exceeds limit ({MAX_FILESIZE_MB}MB)")
            
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
        _cleanup_partial_downloads(video_id)
        raise e

def _cleanup_partial_downloads(video_id: str) -> None:
    try:
        for file in os.listdir(DOWNLOAD_DIR):
            if file.startswith(video_id):
                file_path = os.path.join(DOWNLOAD_DIR, file)
                os.remove(file_path)
                logger.debug(f"Cleaned up partial download: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to clean up partial downloads: {e}")

@contextmanager
def temp_video_download(url: str):
    video_path = None
    try:
        video_path = download_video(url)
        yield video_path
    finally:
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
                logger.debug(f"Cleaned up temp file: {video_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {video_path}: {e}")