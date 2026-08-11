from .health import router as health_router
from .videos import router as videos_router
from .search import router as search_router
from .me import router as me_router

__all__ = ["health_router", "videos_router", "search_router", "me_router"]
