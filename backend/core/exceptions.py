from urllib.parse import urlparse


class ContentBlockedError(Exception):
    """Gemini returned no usable candidate for the video.

    Usually a safety filter. It is worth distinguishing from a generic failure
    because the user can act on it: nothing about the request was wrong, the
    video itself is what the model refused to describe.
    """

    def __init__(self, reason: str = "UNKNOWN"):
        self.reason = reason
        super().__init__(f"Gemini returned no usable content (reason: {reason})")


ALLOWED_DOMAINS = [
    "twitter.com",
    "x.com", 
]


def validate_video_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        
        return any(
            hostname == domain or hostname.endswith(f".{domain}")
            for domain in ALLOWED_DOMAINS
        )
    except Exception:
        return False
