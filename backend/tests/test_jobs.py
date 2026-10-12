import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import httpx
import pytest

from services import jobs

USER = "00000000-0000-4000-8000-000000000001"
NOW = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)


def _row(stage: str, minutes_ago: float = 0) -> dict:
    return {
        "user_id": USER,
        "id": "job-1",
        "url": "https://x.com/a/status/1",
        "stage": stage,
        "updated_at": (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat(),
    }


def _table_holding(rows):
    supabase = MagicMock()
    table = supabase.table.return_value
    table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = rows
    return supabase, table


class TestStaleness:
    """A job the server died on would otherwise look busy forever."""

    def test_a_job_is_fresh_within_the_window(self):
        job = {"updated_at": (NOW - jobs.STALE_AFTER + timedelta(seconds=1)).isoformat()}

        assert jobs._is_stale(job, NOW) is False

    def test_a_job_is_stale_past_the_window(self):
        job = {"updated_at": (NOW - jobs.STALE_AFTER - timedelta(seconds=1)).isoformat()}

        assert jobs._is_stale(job, NOW) is True


class TestCurrent:

    def test_is_none_when_the_user_has_no_analysis(self):
        supabase, _ = _table_holding([])

        with patch("services.jobs.supabase", supabase):
            assert jobs._current(USER) is None

    def test_reports_a_job_still_being_worked_on(self):
        supabase, _ = _table_holding([_row("watching", minutes_ago=1)])

        with patch("services.jobs.supabase", supabase):
            assert jobs._current(USER)["stage"] == "watching"

    def test_reports_an_abandoned_job_as_failed_and_free(self):
        supabase, _ = _table_holding([_row("watching", minutes_ago=30)])

        with patch("services.jobs.supabase", supabase):
            job = jobs._current(USER)

        assert job["stage"] == "failed"
        assert "Nothing was taken from your quota" in job["error_detail"]

    def test_keeps_a_finished_analysis_however_old(self):
        supabase, _ = _table_holding([_row("done", minutes_ago=60 * 24 * 30)])

        with patch("services.jobs.supabase", supabase):
            assert jobs._current(USER)["stage"] == "done"


class TestWriting:

    def test_starting_replaces_the_row_of_the_user(self):
        supabase = MagicMock()

        with patch("services.jobs.supabase", supabase):
            job = jobs._start(USER, "https://x.com/a/status/1", True, False)

        row = supabase.table.return_value.upsert.call_args[0][0]
        assert supabase.table.return_value.upsert.call_args[1] == {"on_conflict": "user_id"}
        assert row["stage"] == "queued"
        assert row["result"] is None and row["error_detail"] is None
        assert (row["analyze_scenes"], row["analyze_audio"]) == (True, False)
        assert job["id"] == row["id"]

    def test_each_start_is_a_run_of_its_own(self):
        with patch("services.jobs.supabase", MagicMock()):
            first = jobs._start(USER, "https://x.com/a/status/1", True, True)
            second = jobs._start(USER, "https://x.com/a/status/1", True, True)

        assert first["id"] != second["id"]

    def test_progress_is_written_to_the_run_not_the_user(self):
        """A cancelled run that is slow to stop must not write over the next one."""
        supabase = MagicMock()

        with patch("services.jobs.supabase", supabase):
            jobs._update("job-1", {"stage": "writing"})

        update = supabase.table.return_value.update
        assert update.call_args[0][0]["stage"] == "writing"
        update.return_value.eq.assert_called_once_with("id", "job-1")

    def test_a_progress_update_that_fails_does_not_stop_the_analysis(self):
        supabase = MagicMock()
        supabase.table.side_effect = RuntimeError("connection reset")

        with patch("services.jobs.supabase", supabase):
            asyncio.run(jobs.advance("job-1", "uploading"))


class TestDiscard:

    def test_removes_whatever_the_user_has(self):
        supabase = MagicMock()
        delete = supabase.table.return_value.delete.return_value
        delete.eq.return_value.execute.return_value.data = [_row("done")]

        with patch("services.jobs.supabase", supabase):
            removed = jobs._discard(USER, None)

        assert removed["id"] == "job-1"
        delete.eq.assert_called_once_with("user_id", USER)

    def test_can_be_limited_to_the_analysis_of_one_link(self):
        supabase = MagicMock()
        by_user = supabase.table.return_value.delete.return_value.eq.return_value
        by_user.eq.return_value.execute.return_value.data = []

        with patch("services.jobs.supabase", supabase):
            removed = jobs._discard(USER, "https://x.com/a/status/2")

        assert removed is None
        by_user.eq.assert_called_once_with("url", "https://x.com/a/status/2")


class TestDroppedConnections:
    """The analysis is paid for by the time its result is written down."""

    def test_tries_again_when_the_connection_drops(self):
        write = MagicMock(side_effect=[httpx.ReadError("reset"), "written"], __name__="write")

        with patch("services.jobs.time.sleep"):
            assert jobs._steadily(write, "job-1") == "written"

        assert write.call_count == 2

    def test_gives_up_after_a_few_attempts(self):
        write = MagicMock(side_effect=httpx.ReadError("reset"), __name__="write")

        with patch("services.jobs.time.sleep"), pytest.raises(httpx.ReadError):
            jobs._steadily(write, "job-1")

        assert write.call_count == jobs.ATTEMPTS

    def test_does_not_repeat_a_request_the_database_refused(self):
        write = MagicMock(side_effect=ValueError("bad row"), __name__="write")

        with pytest.raises(ValueError):
            jobs._steadily(write, "job-1")

        write.assert_called_once()
