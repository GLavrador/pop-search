import pytest
from core.limiter import limiter

@pytest.fixture(autouse=True)
def reset_limiter_storage():

    if hasattr(limiter, "_storage"):
        try:
            limiter._storage.reset()
        except Exception:
            
            if hasattr(limiter._storage, "storage"):
                limiter._storage.storage.clear()