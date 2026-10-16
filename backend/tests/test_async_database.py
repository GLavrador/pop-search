import asyncio
import threading
from types import SimpleNamespace
from unittest.mock import patch

import httpx
import pytest

from main import app


@pytest.mark.parametrize("path", ["/search", "/videos"])
def test_health_remains_responsive_while_database_is_waiting(path):
    entered = threading.Event()
    released = threading.Event()
    finished = threading.Event()

    def execute():
        entered.set()
        try:
            assert released.wait(5), "The event loop could not release the database call"
            if path == "/search":
                return SimpleNamespace(data=[])
            return (("data", [{"id": "video-1"}]), ("count", None))
        finally:
            finished.set()

    async def exercise():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            payload = {"query": "cat", "mode": "text"} if path == "/search" else {
                "titulo_sugerido": "Video title",
                "descricao_completa": "A description long enough to save.",
                "url_original": "https://x.com/a/status/1",
                "metadados_estruturados": {},
            }
            pending = asyncio.create_task(client.post(path, json=payload))
            try:
                assert await asyncio.to_thread(entered.wait, 3)
                health = await client.get("/")
                assert health.status_code == 200
                assert not finished.is_set()
            finally:
                released.set()
                result = await pending
            assert result.status_code == 200

    with patch("routers.search.supabase") as search_db, patch("routers.videos.supabase") as video_db, \
         patch("routers.videos.create_embedding", return_value=[0.1] * 768):
        search_db.rpc.return_value.execute.side_effect = execute
        video_db.table.return_value.insert.return_value.execute.side_effect = execute
        asyncio.run(exercise())
