from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from google.api_core.exceptions import ResourceExhausted

from core.exceptions import ServiceQuotaExhaustedError
from main import app
from services import usage
from services.usage import ProjectUsage
from tests.conftest import TEST_USER_ID

client = TestClient(app)

ANALYZE_BODY = {"url": "https://twitter.com/user/status/123"}


class TestProjectCeiling:
    """Per-user limits divide a pie; this is the pie."""

    def test_refuses_once_the_project_has_had_enough_for_today(self):
        full = ProjectUsage(analyses_today=100, daily_limit=100)

        with patch("routers.videos.get_project_usage", new=AsyncMock(return_value=full)):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 503
        assert "today" in response.text.lower()

    def test_says_the_user_keeps_their_quota(self):
        full = ProjectUsage(analyses_today=100, daily_limit=100)

        with patch("routers.videos.get_project_usage", new=AsyncMock(return_value=full)):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert "Nothing was taken from your quota" in response.json()["detail"]

    @patch("routers.videos.download_video")
    def test_does_not_charge_or_download(self, mock_download):
        full = ProjectUsage(analyses_today=100, daily_limit=100)
        recorder = AsyncMock()

        with patch("routers.videos.get_project_usage", new=AsyncMock(return_value=full)), \
             patch("routers.videos.record_event", new=recorder):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        mock_download.assert_not_called()
        recorder.assert_not_awaited()

    def test_the_personal_limit_is_reported_first(self):
        """Both walls can be up at once. The user's own limit is the one they
        can act on, so blaming the project would be unhelpful."""
        from services.usage import Quota

        exhausted_user = Quota(used=20, limit=20, resets_at="2026-09-01T00:00:00+00:00")
        full_project = ProjectUsage(analyses_today=100, daily_limit=100)

        with patch("routers.videos.get_quota", new=AsyncMock(return_value=exhausted_user)), \
             patch("routers.videos.get_project_usage", new=AsyncMock(return_value=full_project)):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 429
        assert "this month" in response.json()["detail"]


class TestServiceExhaustion:
    """Google refusing the call is not the same as the call failing."""

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_reports_a_refused_call_as_a_service_problem(self, mock_download, mock_analyze):
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = ServiceQuotaExhaustedError("429 quota exceeded")

        response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 503
        assert "out of capacity" in response.json()["detail"]

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_does_not_charge_for_a_call_that_never_ran(self, mock_download, mock_analyze):
        """Regression: this used to consume one of the user's analyses and
        surface as a generic 500, at the exact moment the project was in trouble."""
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = ServiceQuotaExhaustedError("429 quota exceeded")
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        recorder.assert_not_awaited()

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_a_genuine_failure_is_still_charged(self, mock_download, mock_analyze):
        """Only a refusal is free. An error after the model ran still cost."""
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = Exception("something else broke")
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        recorder.assert_awaited_once()


def test_google_refusal_is_translated_at_the_boundary():
    """The router should not need to know google.api_core exists."""
    from services import ai

    uploaded = type("F", (), {"state": type("S", (), {"name": "ACTIVE"})(), "name": "f", "uri": "u"})()

    async def refuse(*_args, **_kwargs):
        raise ResourceExhausted("429 quota exceeded")

    import asyncio
    import pytest

    with patch("services.ai.genai") as mock_genai, patch("services.ai.model") as mock_model:
        mock_genai.upload_file.return_value = uploaded
        mock_model.generate_content_async = refuse

        with pytest.raises(ServiceQuotaExhaustedError):
            asyncio.run(ai.analyze_video_content("fake.mp4"))


class TestDayWindow:

    def test_day_start_is_midnight_utc(self):
        now = datetime(2026, 8, 11, 15, 30, tzinfo=timezone.utc)

        assert usage._day_start(now) == datetime(2026, 8, 11, tzinfo=timezone.utc)

    def test_counts_only_analyses_from_today(self):
        with patch("services.usage.supabase") as mock_supabase:
            chain = mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value
            chain.execute.return_value.count = 42

            result = usage._fetch_project_usage()

        assert result.analyses_today == 42
        assert result.is_exhausted is (42 >= usage.DAILY_ANALYSIS_LIMIT)
