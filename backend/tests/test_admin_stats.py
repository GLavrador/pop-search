from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from services import usage

client = TestClient(app)


def _event(kind="analysis", tokens=5000, succeeded=True, reason=None, days_ago=0):
    when = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return {
        "kind": kind,
        "succeeded": succeeded,
        "failure_reason": reason,
        "total_tokens": tokens,
        "created_at": when.isoformat(),
    }


def _with_events(events):
    mock = patch("services.usage.supabase").start()
    chain = mock.table.return_value.select.return_value.gte.return_value.order.return_value.limit.return_value
    chain.execute.return_value.data = events
    return mock


class TestCostPerAnalysis:

    def teardown_method(self):
        patch.stopall()

    def test_reports_the_spread_not_just_the_average(self):
        """The distribution is skewed, so an average alone would mislead the
        calibration of the daily ceiling."""
        _with_events([_event(tokens=2000), _event(tokens=4000), _event(tokens=12000)])

        stats = usage._fetch_admin_stats(30)

        assert stats.avg_tokens == 6000
        assert stats.median_tokens == 4000
        assert stats.min_tokens == 2000
        assert stats.max_tokens == 12000

    def test_ignores_analyses_that_reported_no_cost(self):
        """A refused call records zero. Averaging those in would understate what
        an analysis actually costs."""
        _with_events([_event(tokens=6000), _event(tokens=0, succeeded=False, reason="refused")])

        stats = usage._fetch_admin_stats(30)

        assert stats.avg_tokens == 6000
        assert stats.measured == 1
        assert stats.analyses == 2

    def test_projects_what_a_full_day_would_cost(self):
        _with_events([_event(tokens=5000)])

        stats = usage._fetch_admin_stats(30)

        assert stats.projected_tokens_at_limit == 5000 * stats.daily_limit

    def test_survives_an_empty_window(self):
        _with_events([])

        stats = usage._fetch_admin_stats(7)

        assert stats.analyses == 0
        assert stats.avg_tokens == 0
        assert stats.failure_rate == 0.0


class TestFailures:

    def teardown_method(self):
        patch.stopall()

    def test_counts_the_rate_and_the_tokens_burned_for_nothing(self):
        _with_events([
            _event(tokens=5000),
            _event(tokens=8000, succeeded=False, reason="blocked:SAFETY"),
            _event(tokens=3000, succeeded=False, reason="timeout"),
            _event(tokens=4000),
        ])

        stats = usage._fetch_admin_stats(30)

        assert stats.failures == 2
        assert stats.failure_rate == 0.5
        assert stats.tokens_wasted == 11000

    def test_groups_reasons_by_how_often_they_bite(self):
        _with_events([
            _event(succeeded=False, reason="blocked:SAFETY"),
            _event(succeeded=False, reason="blocked:SAFETY"),
            _event(succeeded=False, reason="timeout"),
        ])

        stats = usage._fetch_admin_stats(30)

        assert stats.failures_by_reason[0] == {"reason": "blocked:SAFETY", "count": 2}

    def test_labels_a_failure_with_no_reason(self):
        _with_events([_event(succeeded=False, reason=None)])

        stats = usage._fetch_admin_stats(30)

        assert stats.failures_by_reason == [{"reason": "unknown", "count": 1}]


class TestDailySeries:

    def teardown_method(self):
        patch.stopall()

    def test_groups_by_day_in_chronological_order(self):
        _with_events([_event(days_ago=2), _event(days_ago=0), _event(days_ago=0)])

        stats = usage._fetch_admin_stats(7)

        assert [point["analyses"] for point in stats.daily] == [1, 2]
        assert stats.daily[0]["date"] < stats.daily[1]["date"]

    def test_counts_only_today_for_the_ceiling(self):
        _with_events([_event(days_ago=0), _event(days_ago=1), _event(days_ago=1)])

        stats = usage._fetch_admin_stats(7)

        assert stats.analyses_today == 1

    def test_saves_do_not_pollute_the_analysis_series(self):
        _with_events([_event(kind="save", tokens=None), _event(kind="analysis")])

        stats = usage._fetch_admin_stats(7)

        assert stats.analyses == 1
        assert stats.saves == 1
        assert sum(point["analyses"] for point in stats.daily) == 1


class TestEndpoint:

    def test_hides_itself_from_a_regular_user(self):
        assert client.get("/me/admin/stats").status_code == 404

    def test_requires_a_session(self, anonymous):
        assert client.get("/me/admin/stats").status_code == 401

    def test_rejects_a_range_it_does_not_offer(self):
        """An open range would let one request scan the whole table."""
        with patch("routers.me.is_admin", new=AsyncMock(return_value=True)):
            assert client.get("/me/admin/stats?days=9999").status_code == 422

    def test_serves_an_admin(self):
        stats = usage.AdminStats(
            range_days=30, analyses=3, saves=1, tokens=15000,
            avg_tokens=5000, median_tokens=5000, min_tokens=4000, max_tokens=6000,
            measured=3, failures=1, failure_rate=0.33, tokens_wasted=4000,
            failures_by_reason=[{"reason": "timeout", "count": 1}],
            daily=[{"date": "2026-08-11", "analyses": 3, "tokens": 15000}],
            analyses_today=3, daily_limit=100, projected_tokens_at_limit=500000,
        )

        with patch("routers.me.is_admin", new=AsyncMock(return_value=True)), \
             patch("routers.me.get_admin_stats", new=AsyncMock(return_value=stats)), \
             patch("routers.me.get_all_usage", new=AsyncMock(return_value=[])):
            body = client.get("/me/admin/stats?days=30").json()

        assert body["avg_tokens"] == 5000
        assert body["failures_by_reason"] == [{"reason": "timeout", "count": 1}]
        assert body["projected_tokens_at_limit"] == 500000
