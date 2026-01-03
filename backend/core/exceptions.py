class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class VideoDownloadError(AppError):
    def __init__(self, message: str = "Failed to download video"):
        super().__init__(message, status_code=400)


class VideoAnalysisError(AppError):
    def __init__(self, message: str = "Failed to analyze video"):
        super().__init__(message, status_code=500)


class InvalidURLError(AppError):
    def __init__(self, message: str = "Invalid or unsupported URL"):
        super().__init__(message, status_code=400)


ALLOWED_DOMAINS = [
    "twitter.com",
    "x.com", 
]


def validate_video_url(url: str) -> bool:
    from urllib.parse import urlparse
    
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        
        return any(
            hostname == domain or hostname.endswith(f".{domain}")
            for domain in ALLOWED_DOMAINS
        )
    except Exception:
        return False
