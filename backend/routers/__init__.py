from .health import router as health_router
from .videos import router as videos_router
from .search import router as search_router

__all__ = ["health_router", "videos_router", "search_router"]
