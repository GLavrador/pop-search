from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app
from tests.conftest import TEST_USER_ID

client = TestClient(app)


def _kept(mock_supabase, row=None):
    """The table as it stands for the caller: their one row, or none yet."""
    table = mock_supabase.table.return_value
    reading = table.select.return_value.eq.return_value.limit.return_value
    reading.execute.return_value.data = [row] if row else []
    return table


def _written(table):
    return table.upsert.call_args[0][0]


@patch("routers.me.supabase")
class TestReading:

    def test_has_nothing_for_someone_who_never_played(self, mock_supabase):
        _kept(mock_supabase)

        response = client.get("/me/bin-records")

        assert response.status_code == 200
        assert response.json() == {"flappy": 0, "dino": 0}

    def test_brings_what_was_kept(self, mock_supabase):
        _kept(mock_supabase, {"flappy": 14, "dino": 1509})

        assert client.get("/me/bin-records").json() == {"flappy": 14, "dino": 1509}

    def test_reads_only_the_row_of_the_caller(self, mock_supabase):
        table = _kept(mock_supabase)

        client.get("/me/bin-records")

        assert table.select.return_value.eq.call_args.args == ("user_id", TEST_USER_ID)

    def test_hides_the_cause_of_a_failure(self, mock_supabase):
        mock_supabase.table.side_effect = RuntimeError("relation bin_records does not exist")

        response = client.get("/me/bin-records")

        assert response.status_code == 500
        assert "bin_records" not in response.text

    def test_requires_a_session(self, mock_supabase, anonymous):
        assert client.get("/me/bin-records").status_code == 401


@patch("routers.me.supabase")
class TestKeeping:

    def test_keeps_the_first_records_of_someone_new(self, mock_supabase):
        table = _kept(mock_supabase)

        response = client.put("/me/bin-records", json={"flappy": 12, "dino": 300})

        assert response.status_code == 200
        assert response.json() == {"flappy": 12, "dino": 300}
        written = _written(table)
        assert written["user_id"] == TEST_USER_ID
        assert (written["flappy"], written["dino"]) == (12, 300)

    def test_keeps_the_best_of_each_game_from_either_side(self, mock_supabase):
        table = _kept(mock_supabase, {"flappy": 20, "dino": 100})

        response = client.put("/me/bin-records", json={"flappy": 9, "dino": 450})

        assert response.json() == {"flappy": 20, "dino": 450}
        assert (_written(table)["flappy"], _written(table)["dino"]) == (20, 450)

    def test_writes_nothing_when_nothing_was_beaten(self, mock_supabase):
        table = _kept(mock_supabase, {"flappy": 20, "dino": 450})

        response = client.put("/me/bin-records", json={"flappy": 3, "dino": 450})

        assert response.json() == {"flappy": 20, "dino": 450}
        table.upsert.assert_not_called()

    def test_takes_a_game_left_out_for_no_score_at_all(self, mock_supabase):
        _kept(mock_supabase, {"flappy": 5, "dino": 80})

        assert client.put("/me/bin-records", json={"dino": 90}).json() == {"flappy": 5, "dino": 90}

    def test_refuses_a_score_below_zero(self, mock_supabase):
        table = _kept(mock_supabase)

        assert client.put("/me/bin-records", json={"flappy": -1, "dino": 0}).status_code == 422
        table.upsert.assert_not_called()

    def test_refuses_a_score_no_one_could_reach(self, mock_supabase):
        table = _kept(mock_supabase)

        assert client.put("/me/bin-records", json={"flappy": 10**9, "dino": 0}).status_code == 422
        table.upsert.assert_not_called()

    def test_hides_the_cause_of_a_failure(self, mock_supabase):
        table = _kept(mock_supabase)
        table.upsert.side_effect = RuntimeError("connection refused")

        response = client.put("/me/bin-records", json={"flappy": 1, "dino": 1})

        assert response.status_code == 500
        assert "connection refused" not in response.text

    def test_requires_a_session(self, mock_supabase, anonymous):
        assert client.put("/me/bin-records", json={"flappy": 1, "dino": 1}).status_code == 401
