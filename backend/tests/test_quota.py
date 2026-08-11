from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from core.exceptions import ContentBlockedError
from main import app
from services import usage
from services.usage import Quota
from tests.conftest import TEST_USER_ID

client = TestClient(app)

ANALYZE_BODY = {"url": "https://twitter.com/user/status/123"}


class TestQuotaMath:

    def test_counts_remaining_from_the_limit(self):
        assert Quota(used=3, limit=20, resets_at="").remaining == 17

    def test_never_reports_negative_remaining(self):
        assert Quota(used=25, limit=20, resets_at="").remaining == 0

    def test_is_exhausted_on_the_boundary(self):
        assert Quota(used=20, limit=20, resets_at="").is_exhausted is True
        assert Quota(used=19, limit=20, resets_at="").is_exhausted is False


class TestMonthWindow:
    """The limit resets on the 1st, so the window is the calendar month."""

    def test_month_start_is_the_first_at_midnight(self):
        now = datetime(2026, 8, 11, 15, 30, tzinfo=timezone.utc)

        assert usage._month_start(now) == datetime(2026, 8, 1, tzinfo=timezone.utc)

    def test_next_month_rolls_the_year_in_december(self):
        now = datetime(2026, 12, 24, tzinfo=timezone.utc)

        assert usage._next_month_start(now) == datetime(2027, 1, 1, tzinfo=timezone.utc)


class TestQuotaEnforcement:

    def test_refuses_a_new_analysis_once_the_limit_is_reached(self):
        exhausted = Quota(used=20, limit=20, resets_at="2026-09-01T00:00:00+00:00")

        with patch("routers.videos.get_quota", new=AsyncMock(return_value=exhausted)):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 429
        assert "2026-09-01" in response.text
        assert "20 analyses" in response.text

    @patch("routers.videos.download_video")
    def test_checks_before_downloading(self, mock_download):
        """Downloading first would burn bandwidth and time on a request that was
        always going to be refused."""
        exhausted = Quota(used=20, limit=20, resets_at="2026-09-01T00:00:00+00:00")

        with patch("routers.videos.get_quota", new=AsyncMock(return_value=exhausted)):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        mock_download.assert_not_called()


class TestUsageRecording:

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_records_a_successful_analysis(self, mock_download, mock_analyze):
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.return_value = {
            "titulo_sugerido": "Um titulo valido",
            "descricao_completa": "Uma descricao suficientemente longa para validar",
            "metadados_estruturados": {},
        }
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 200
        recorder.assert_awaited_once_with(TEST_USER_ID, "analysis", True, None, 0, 0, 0)

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_still_charges_a_blocked_analysis_and_says_why(self, mock_download, mock_analyze):
        """The tokens were spent even though the user got nothing back."""
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = ContentBlockedError("SAFETY")
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 422
        recorder.assert_awaited_once_with(TEST_USER_ID, "analysis", False, "blocked:SAFETY", 0, 0, 0)

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_records_a_timeout_with_its_reason(self, mock_download, mock_analyze):
        import asyncio

        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = asyncio.TimeoutError()
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 504
        recorder.assert_awaited_once_with(TEST_USER_ID, "analysis", False, "timeout", 0, 0, 0)

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_stores_the_tokens_the_analysis_reported(self, mock_download, mock_analyze):
        mock_download.return_value = "does-not-exist.mp4"

        async def fill_usage(_path, _scenes, _audio, usage):
            usage.prompt, usage.output, usage.total = 8451, 609, 10890
            return {
                "titulo_sugerido": "Um titulo valido",
                "descricao_completa": "Uma descricao suficientemente longa para validar",
                "metadados_estruturados": {},
            }

        mock_analyze.side_effect = fill_usage
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        recorder.assert_awaited_once_with(
            TEST_USER_ID, "analysis", True, None, 8451, 609, 10890
        )

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_stores_the_tokens_of_a_failed_analysis(self, mock_download, mock_analyze):
        """The whole reason usage is filled in place: a blocked video still
        burned its input tokens, and a return value never arrives."""
        mock_download.return_value = "does-not-exist.mp4"

        async def burn_then_fail(_path, _scenes, _audio, usage):
            usage.prompt, usage.output, usage.total = 8000, 0, 8523
            raise ContentBlockedError("SAFETY")

        mock_analyze.side_effect = burn_then_fail
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            client.post("/videos/analyze", json=ANALYZE_BODY)

        recorder.assert_awaited_once_with(
            TEST_USER_ID, "analysis", False, "blocked:SAFETY", 8000, 0, 8523
        )

    @patch("routers.videos.download_video")
    def test_does_not_charge_when_the_download_fails(self, mock_download):
        """No Gemini call means no tokens spent, so charging would be unfair and
        would protect nothing."""
        mock_download.side_effect = Exception("network is down")
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos/analyze", json=ANALYZE_BODY)

        assert response.status_code == 500
        recorder.assert_not_awaited()

    @patch("routers.videos.supabase")
    @patch("routers.videos.create_embedding")
    def test_records_a_save_separately_from_an_analysis(self, mock_embedding, mock_supabase):
        mock_embedding.return_value = [0.1] * 768
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            ("data", [{"id": "video-1"}]),
            ("count", None),
        )
        recorder = AsyncMock()

        with patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos", json={
                "titulo_sugerido": "Um titulo valido",
                "descricao_completa": "Uma descricao suficientemente longa para validar",
                "url_original": "https://twitter.com/user/status/123",
                "metadados_estruturados": {},
            })

        assert response.status_code == 200
        recorder.assert_awaited_once_with(TEST_USER_ID, "save")


class TestQuotaEndpoint:

    def test_reports_the_current_window(self):
        quota = Quota(
            used=7, limit=20, resets_at="2026-09-01T00:00:00+00:00", tokens_this_month=48213
        )

        with patch("routers.me.get_quota", new=AsyncMock(return_value=quota)):
            body = client.get("/me/quota").json()

        assert body == {
            "used": 7,
            "limit": 20,
            "remaining": 13,
            "resets_at": "2026-09-01T00:00:00+00:00",
            "tokens_this_month": 48213,
        }

    def test_requires_a_session(self, anonymous):
        assert client.get("/me/quota").status_code == 401


class TestProfileLookup:

    def _supabase_with(self, profile_rows, count=0, token_rows=None):
        mock = patch("services.usage.supabase").start()
        table = mock.table.return_value
        table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = profile_rows
        counted = table.select.return_value.eq.return_value.eq.return_value.gte.return_value
        counted.execute.return_value.count = count
        summed = table.select.return_value.eq.return_value.gte.return_value
        summed.execute.return_value.data = token_rows or []
        return mock

    def teardown_method(self):
        patch.stopall()

    def test_uses_the_limit_stored_on_the_profile(self):
        self._supabase_with([{"monthly_analysis_limit": 5}], count=2)

        quota = usage._fetch_quota(TEST_USER_ID)

        assert quota.limit == 5
        assert quota.used == 2

    def test_sums_the_tokens_spent_this_month(self):
        self._supabase_with(
            [{"monthly_analysis_limit": 20}],
            count=3,
            token_rows=[{"total_tokens": 8000}, {"total_tokens": 4104}, {"total_tokens": None}],
        )

        quota = usage._fetch_quota(TEST_USER_ID)

        # The None comes from a save, which spends an embedding we do not measure.
        assert quota.tokens_this_month == 12104

    def test_warns_when_the_profile_is_missing(self):
        """A user with no profile means the signup trigger failed. Falling back
        quietly would hide that and hand out the default allowance."""
        self._supabase_with([])

        with patch("services.usage.logger") as mock_logger:
            quota = usage._fetch_quota(TEST_USER_ID)

        assert quota.limit == usage.DEFAULT_MONTHLY_LIMIT
        mock_logger.warning.assert_called_once()


class TestRecordEventResilience:

    @pytest.mark.asyncio
    async def test_a_failed_write_does_not_break_the_request(self):
        """The analysis already succeeded; losing the accounting row must not
        turn that into an error for the user."""
        with patch("services.usage.supabase") as mock_supabase:
            mock_supabase.table.side_effect = Exception("database unreachable")

            await usage.record_event(TEST_USER_ID, "analysis")
