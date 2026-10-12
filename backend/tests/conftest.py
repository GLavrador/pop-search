import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.auth import current_user
from core.limiter import limiter
from main import app
from services import jobs
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


class FakeJobs:
    """The analysis_jobs table, kept in memory: one row per user."""

    is_running = staticmethod(jobs.is_running)

    def __init__(self):
        self.rows: dict[str, dict] = {}
        self.stages: list[str] = []

    def _by_id(self, job_id):
        return next((row for row in self.rows.values() if row["id"] == job_id), None)

    def _change(self, job_id, **changes):
        row = self._by_id(job_id)
        if row is not None:
            row.update(changes)
            self.stages.append(row["stage"])

    async def start(self, user_id, url, analyze_scenes, analyze_audio):
        row = {
            "user_id": user_id,
            "id": str(uuid.uuid4()),
            "url": url,
            "analyze_scenes": analyze_scenes,
            "analyze_audio": analyze_audio,
            "stage": "queued",
            "result": None,
            "error_status": None,
            "error_detail": None,
            "created_at": "2026-10-11T12:00:00+00:00",
            "updated_at": "2026-10-11T12:00:00+00:00",
        }
        self.rows[user_id] = row
        self.stages = ["queued"]
        return dict(row)

    async def advance(self, job_id, stage):
        self._change(job_id, stage=stage)

    async def finish(self, job_id, result):
        self._change(job_id, stage="done", result=result)

    async def fail(self, job_id, status, detail):
        self._change(job_id, stage="failed", error_status=status, error_detail=detail)

    async def current(self, user_id):
        row = self.rows.get(user_id)
        return dict(row) if row else None

    async def discard(self, user_id, url=None):
        row = self.rows.get(user_id)
        if row is None or (url is not None and row["url"] != url):
            return None
        return self.rows.pop(user_id)


@pytest.fixture(autouse=True)
def job_store():
    """Jobs live in memory, and an analysis runs to its end inside the request
    that started it, so a test can read the outcome right away."""
    store = FakeJobs()

    async def run_now(_job_id, work):
        await work

    with patch("routers.videos.jobs", store), patch("routers.videos.launch", new=run_now):
        yield store


class Outcome:
    """How an analysis ended, read the way a plain response would be."""

    def __init__(self, job: dict):
        self.job = job
        failed = job["stage"] == "failed"
        self.status_code = job["error"]["status"] if failed else 200
        self._body = {"detail": job["error"]["detail"]} if failed else job["result"]

    def json(self):
        return self._body

    @property
    def text(self):
        return json.dumps(self._body)


def analyze(client, body: dict):
    """Starts an analysis and returns how it ended. A request refused before
    any job exists comes back as it is."""
    started = client.post("/videos/analyze", json=body)
    if started.status_code != 202:
        return started
    return Outcome(client.get("/videos/analyze").json())


@pytest.fixture(autouse=True)
def nothing_archived():
    """No link is a copy by default."""
    with patch("routers.videos.find_existing", new=AsyncMock(return_value=None)):
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
         patch("services.archive.supabase", guard), \
         patch("services.jobs.supabase", guard), \
         patch("routers.me.supabase", guard), \
         patch("routers.videos.supabase", guard), \
         patch("routers.search.supabase", guard):
        yield
