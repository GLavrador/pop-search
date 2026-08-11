import pytest

from core.auth import current_user
from core.limiter import limiter
from main import app

TEST_USER_ID = "00000000-0000-4000-8000-000000000001"


@pytest.fixture(autouse=True)
def reset_limiter_storage():

    if hasattr(limiter, "_storage"):
        try:
            limiter._storage.reset()
        except Exception:

            if hasattr(limiter._storage, "storage"):
                limiter._storage.storage.clear()


@pytest.fixture(autouse=True)
def authenticated():
    """Signed in by default, so tests exercise their own subject rather than auth."""
    app.dependency_overrides[current_user] = lambda: TEST_USER_ID
    yield
    app.dependency_overrides.pop(current_user, None)


@pytest.fixture
def anonymous():
    app.dependency_overrides.pop(current_user, None)
    yield
