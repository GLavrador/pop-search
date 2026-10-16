import asyncio
import threading
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import httpx

from main import app
from services import jobs


def test_only_one_concurrent_request_launches_an_analysis():
    reserved = {}
    lock = threading.Lock()
    launched = []

    def rpc(_name, params):
        def execute():
            with lock:
                user_id = params["p_user_id"]
                if user_id in reserved:
                    return SimpleNamespace(data=[])
                row = {
                    "user_id": user_id, "id": params["p_job_id"], "url": params["p_url"],
                    "stage": "queued", "analyze_scenes": params["p_analyze_scenes"],
                    "analyze_audio": params["p_analyze_audio"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                reserved[user_id] = row
                return SimpleNamespace(data=[row])
        return SimpleNamespace(execute=execute)

    async def launch(user_id, work):
        launched.append(user_id)
        work.close()

    async def scenario():
        readers = 0
        both_read = asyncio.Event()

        async def read_empty(_user_id):
            nonlocal readers
            readers += 1
            if readers == 2:
                both_read.set()
            await asyncio.wait_for(both_read.wait(), 2)
            return None

        with patch("routers.videos.jobs", jobs), patch("services.jobs.current", new=read_empty), \
             patch("services.jobs.supabase", MagicMock(rpc=rpc)), patch("routers.videos.launch", new=launch):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                return await asyncio.gather(*(
                    client.post("/videos/analyze", json={"url": f"https://x.com/a/status/{number}"})
                    for number in (1, 2)
                ))

    responses = asyncio.run(scenario())
    assert sorted(response.status_code for response in responses) == [202, 409]
    assert len(launched) == 1
    rejected = next(response for response in responses if response.status_code == 409)
    assert rejected.json()["detail"] == jobs.ALREADY_RUNNING
