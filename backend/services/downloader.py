import os
import re
import uuid
from dataclasses import dataclass
from typing import Optional

import yt_dlp
from core.exceptions import validate_image_url
from core.logger import get_logger
from dtos import MAX_POST_TEXTO_CHARS, PostInfo

logger = get_logger("services.downloader")

DOWNLOAD_DIR = "temp_downloads"
MAX_FILESIZE_MB = 100
SOCKET_TIMEOUT = 30

# X ends the text of a post with a short link to its own media.
SHORT_LINK = re.compile(r"\s*https://t\.co/\w+")

THUMBNAIL_SIZE = "small"

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)


@dataclass
class Download:
    path: str
    post: Optional[PostInfo] = None


def _clip(value: object, limit: int) -> Optional[str]:
    text = value.strip() if isinstance(value, str) else ""
    return text[:limit].rstrip() or None


def read_post(info: dict) -> Optional[PostInfo]:
    """The text and the picture of the post, as yt-dlp found them on the way to
    the video. A post with several videos comes as a list: the text is shared,
    the picture is the first one's."""
    try:
        entries = info.get("entries") or []
        first = entries[0] if entries and isinstance(entries[0], dict) else {}

        def pick(key: str):
            return info.get(key) or first.get(key)

        sizes = pick("thumbnails") or []
        thumbnail = next(
            (size.get("url") for size in sizes if size.get("id") == THUMBNAIL_SIZE),
            None,
        ) or pick("thumbnail")

        text = pick("description")
        post = PostInfo(
            texto=_clip(SHORT_LINK.sub("", text) if isinstance(text, str) else None, MAX_POST_TEXTO_CHARS) or "",
            miniatura=thumbnail if isinstance(thumbnail, str) and validate_image_url(thumbnail) else None,
        )
    except Exception as e:
        logger.warning(f"Could not read the post: {e}")
        return None

    return post if post.texto or post.miniatura else None


def download_video(url: str) -> Download:
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

            post = read_post(info)

            ydl.download([url])

            for file in os.listdir(DOWNLOAD_DIR):
                if file.startswith(video_id):
                    final_path = os.path.join(DOWNLOAD_DIR, file)
                    logger.info(f"Download finished successfully: {final_path}")
                    return Download(final_path, post)

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
