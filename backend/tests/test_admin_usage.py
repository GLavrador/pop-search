from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from services import usage
from services.usage import UserUsage
from tests.conftest import TEST_USER_ID

client = TestClient(app)

SUMMARY = [
    UserUsage(user_id='u1', display_name='Ana', analyses=4, tokens=32000, limit=20),
    UserUsage(user_id='u2', display_name='Bruno', analyses=1, tokens=4000, limit=5),
]


class TestAccess:
    """The route exposes other people's consumption, so who reaches it matters
    more than what it returns."""

    def test_requires_a_session(self, anonymous):
        assert client.get("/me/all-usage").status_code == 401

    def test_hides_itself_from_a_regular_user(self):
        response = client.get("/me/all-usage")

        assert response.status_code == 404
        assert "Ana" not in response.text

    def test_does_not_query_usage_for_a_regular_user(self):
        """Refusing after building the report would still have read every row."""
        aggregator = AsyncMock(return_value=SUMMARY)

        with patch("routers.me.get_all_usage", new=aggregator):
            client.get("/me/all-usage")

        aggregator.assert_not_awaited()

    def test_serves_an_admin(self):
        with patch("routers.me.is_admin", new=AsyncMock(return_value=True)), \
             patch("routers.me.get_all_usage", new=AsyncMock(return_value=SUMMARY)):
            body = client.get("/me/all-usage").json()

        assert [row["display_name"] for row in body["rows"]] == ['Ana', 'Bruno']
        assert body["rows"][0]["tokens"] == 32000

    def test_reports_how_much_of_the_daily_ceiling_is_gone(self):
        """The per-user rows do not say whether the project itself is close to
        the wall, which is the number that decides whether anyone can analyse."""
        from services.usage import ProjectUsage

        with patch("routers.me.is_admin", new=AsyncMock(return_value=True)), \
             patch("routers.me.get_all_usage", new=AsyncMock(return_value=SUMMARY)), \
             patch("routers.me.get_project_usage",
                   new=AsyncMock(return_value=ProjectUsage(analyses_today=37, daily_limit=100))):
            body = client.get("/me/all-usage").json()

        assert body["analyses_today"] == 37
        assert body["daily_limit"] == 100

    def test_reports_whether_the_caller_is_an_admin(self):
        assert client.get("/me/is-admin").json() == {"is_admin": False}

        with patch("routers.me.is_admin", new=AsyncMock(return_value=True)):
            assert client.get("/me/is-admin").json() == {"is_admin": True}


class TestAggregation:

    def _supabase_with(self, profiles, events):
        mock = patch("services.usage.supabase").start()
        table = mock.table.return_value
        table.select.return_value.execute.return_value.data = profiles
        table.select.return_value.gte.return_value.execute.return_value.data = events
        return mock

    def teardown_method(self):
        patch.stopall()

    def test_counts_analyses_and_sums_tokens_per_user(self):
        self._supabase_with(
            profiles=[
                {"id": "u1", "display_name": "Ana", "monthly_analysis_limit": 20},
                {"id": "u2", "display_name": "Bruno", "monthly_analysis_limit": 5},
            ],
            events=[
                {"user_id": "u1", "kind": "analysis", "total_tokens": 8000},
                {"user_id": "u1", "kind": "analysis", "total_tokens": 4000},
                {"user_id": "u1", "kind": "save", "total_tokens": None},
                {"user_id": "u2", "kind": "analysis", "total_tokens": 3000},
            ],
        )

        rows = {row.user_id: row for row in usage._fetch_all_usage()}

        # The save contributes to neither count nor tokens: it has no measurement.
        assert rows["u1"].analyses == 2
        assert rows["u1"].tokens == 12000
        assert rows["u2"].analyses == 1

    def test_includes_users_who_did_nothing_this_month(self):
        self._supabase_with(
            profiles=[{"id": "u3", "display_name": "Carla", "monthly_analysis_limit": 20}],
            events=[],
        )

        rows = usage._fetch_all_usage()

        assert len(rows) == 1
        assert rows[0].analyses == 0
        assert rows[0].tokens == 0

    def test_orders_by_the_heaviest_consumer(self):
        self._supabase_with(
            profiles=[
                {"id": "small", "display_name": "Small", "monthly_analysis_limit": 20},
                {"id": "big", "display_name": "Big", "monthly_analysis_limit": 20},
            ],
            events=[
                {"user_id": "small", "kind": "analysis", "total_tokens": 100},
                {"user_id": "big", "kind": "analysis", "total_tokens": 90000},
            ],
        )

        assert [row.display_name for row in usage._fetch_all_usage()] == ['Big', 'Small']


def test_admin_check_reads_the_profile_flag():
    with patch("services.usage.supabase") as mock_supabase:
        chain = mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value
        chain.execute.return_value.data = [{"is_admin": True}]

        assert usage._fetch_is_admin(TEST_USER_ID) is True


def test_missing_profile_is_not_an_admin():
    with patch("services.usage.supabase") as mock_supabase:
        chain = mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value
        chain.execute.return_value.data = []

        assert usage._fetch_is_admin(TEST_USER_ID) is False
