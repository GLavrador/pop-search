import logging
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
import pytest

from main import app
from services.embedding import _embed_query
from tests.conftest import DOWNLOADED


@pytest.fixture(autouse=True)
def capture_application_logs(caplog):
    caplog.set_level(logging.DEBUG, logger="popsearch")
    with patch.object(logging.getLogger("popsearch"), "propagate", True):
        yield


def test_search_logs_sizes_and_error_types_without_query_text(caplog):
    secret = "private search phrase"
    caplog.set_level(logging.DEBUG)
    with patch("routers.search.supabase") as db:
        db.rpc.return_value.execute.side_effect = RuntimeError(secret)
        response = TestClient(app).post("/search", json={"query": secret, "mode": "text"})
    assert response.status_code == 500
    assert secret not in caplog.text
    assert "query_chars=21" in caplog.text
    assert "error_type=RuntimeError" in caplog.text


def test_embedding_logs_no_query_text(caplog):
    caplog.set_level(logging.DEBUG)
    _embed_query.cache_clear()
    with patch("services.embedding.genai") as genai:
        genai.embed_content.return_value = {"embedding": [0.1]}
        _embed_query("private embedding phrase")
    _embed_query.cache_clear()
    assert "private embedding phrase" not in caplog.text
    assert "query_chars=24" in caplog.text


def test_invalid_ai_output_is_not_logged_with_the_url(caplog):
    caplog.set_level(logging.DEBUG)
    invalid = {"titulo_sugerido": "private AI output", "descricao_completa": "bad"}
    with patch("routers.videos.download_video", return_value=DOWNLOADED), \
         patch("routers.videos.analyze_video_content", new=AsyncMock(return_value=invalid)):
        response = TestClient(app).post("/videos/analyze", json={"url": "https://x.com/private/status/1"})
    assert response.status_code == 202
    assert "private AI output" not in caplog.text
    assert "https://x.com/private/status/1" not in caplog.text
    assert "error_type=ValidationError" in caplog.text
