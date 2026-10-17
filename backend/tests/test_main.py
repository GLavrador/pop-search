import os
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from main import app
from core.version import VERSION

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "version" in response.json()


def test_the_time_a_search_took_can_be_read_from_the_page():
    origin = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")[0]

    response = client.get("/", headers={"Origin": origin})

    assert "Server-Timing" in response.headers["access-control-expose-headers"]


def _database_with(videos):
    database = MagicMock()
    database.table.return_value.select.return_value.execute.return_value.count = videos
    return database


def test_system_report_says_what_the_server_is_made_of():
    with patch("routers.health.supabase", _database_with(128)), \
         patch("routers.health.questions_kept", return_value=3):
        response = client.get("/system")

    assert response.status_code == 200
    report = response.json()
    assert report["version"] == VERSION
    assert report["uptime_seconds"] >= 0
    assert report["framework"].startswith("FastAPI ")
    assert report["downloader"].startswith("yt-dlp ")
    assert report["database"]["ok"] is True
    assert report["database"]["videos"] == 128
    assert report["database"]["ms"] >= 0
    assert report["ai"] == {
        "analysis_model": "gemini-2.5-flash",
        "embedding_model": "gemini-embedding-001",
        "dimensions": 768,
        "questions_kept": 3,
        "questions_room": 256,
    }


def test_system_report_counts_the_videos_without_fetching_them():
    database = _database_with(128)

    with patch("routers.health.supabase", database):
        client.get("/system")

    database.table.assert_called_once_with("videos")
    database.table.return_value.select.assert_called_once_with("id", count="exact", head=True)


def test_system_report_still_answers_when_the_database_does_not():
    database = MagicMock()
    database.table.return_value.select.return_value.execute.side_effect = RuntimeError("down")

    with patch("routers.health.supabase", database):
        response = client.get("/system")

    assert response.status_code == 200
    assert response.json()["database"] == {"ok": False, "ms": None, "videos": None}
    assert response.json()["version"] == VERSION


def test_system_report_is_open_to_visitors(anonymous):
    with patch("routers.health.supabase", _database_with(0)):
        response = client.get("/system")

    assert response.status_code == 200


def test_system_report_never_asks_the_ai_anything():
    with patch("routers.health.supabase", _database_with(1)), \
         patch("services.embedding.genai") as genai:
        client.get("/system")

    genai.embed_content.assert_not_called()
    genai.GenerativeModel.assert_not_called()
