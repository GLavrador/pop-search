from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.auth import current_user
from core.limiter import limiter
from main import app
from services.usage import ProjectUsage, Quota

TEST_USER_ID = "00000000-0000-4000-8000-000000000001"
TEST_QUOTA = Quota(used=0, limit=20, resets_at="2026-09-01T00:00:00+00:00")
TEST_PROJECT = ProjectUsage(analyses_today=0, daily_limit=100)


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


@pytest.fixture(autouse=True)
def quota_available():
    """Within quota by default, and never touching the real database."""
    with patch("routers.videos.get_quota", new=AsyncMock(return_value=TEST_QUOTA)), \
         patch("routers.videos.record_event", new=AsyncMock()), \
         patch("routers.videos.get_project_usage", new=AsyncMock(return_value=TEST_PROJECT)), \
         patch("routers.me.get_quota", new=AsyncMock(return_value=TEST_QUOTA)), \
         patch("routers.me.get_project_usage", new=AsyncMock(return_value=TEST_PROJECT)), \
         patch("routers.me.is_admin", new=AsyncMock(return_value=False)):
        yield


@pytest.fixture(autouse=True)
def no_real_database():
    """An unmocked query passes locally, where credentials work, and fails in CI,
    where they are fake. This makes it fail where the mistake was made."""
    def refuse(*args, **kwargs):
        raise AssertionError(
            "This test reached Supabase for real. Patch the module's `supabase` "
            "or the service function it calls."
        )

    guard = MagicMock()
    guard.table.side_effect = refuse

    with patch("services.usage.supabase", guard), \
         patch("routers.me.supabase", guard), \
         patch("routers.videos.supabase", guard), \
         patch("routers.search.supabase", guard):
        yield
