import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from core.exceptions import ContentBlockedError
from main import app
from routers import videos
from routers.videos import VideoAnalysisRequest, launch as real_launch
from tests.conftest import DOWNLOADED, TEST_USER_ID, FakeJobs, analyze

client = TestClient(app)

URL = "https://twitter.com/user/status/123"
BODY = {"url": URL}

RESULT = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "metadados_estruturados": {},
}

METADATA = {**RESULT, "url_original": URL}


async def _analysis_with_steps(_path, _scenes, _audio, _usage, on_stage=None):
    for stage in ("uploading", "watching", "writing"):
        await on_stage(stage)
    return dict(RESULT)


class TestStarting:
    """The request no longer waits for the analysis: it answers with a job."""

    def test_answers_at_once_with_a_queued_job(self):
        launched = []

        async def hold(user_id, work):
            launched.append(user_id)
            work.close()

        with patch("routers.videos.launch", new=hold):
            response = client.post("/videos/analyze", json={**BODY, "analyze_audio": False})

        job = response.json()
        assert response.status_code == 202
        assert job["stage"] == "queued"
        assert (job["url"], job["analyze_scenes"], job["analyze_audio"]) == (URL, True, False)
        assert launched == [TEST_USER_ID]

    def test_refuses_a_second_analysis_while_one_runs(self, job_store):
        """The quota is charged when an analysis ends, so two started together
        would both pass under it."""
        asyncio.run(job_store.start(TEST_USER_ID, URL, True, True))
        job_store.rows[TEST_USER_ID]["stage"] = "watching"

        response = client.post("/videos/analyze", json={"url": "https://x.com/a/status/9"})

        assert response.status_code == 409
        assert "already have an analysis running" in response.json()["detail"]
        assert job_store.rows[TEST_USER_ID]["url"] == URL

    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_takes_the_place_of_an_analysis_left_unsaved(self, _download, job_store):
        analyze(client, BODY)

        analyze(client, {"url": "https://x.com/a/status/9"})

        assert job_store.rows[TEST_USER_ID]["url"] == "https://x.com/a/status/9"

    def test_hides_a_failure_to_reach_the_job_table(self, job_store):
        job_store.current = AsyncMock(side_effect=RuntimeError("relation analysis_jobs does not exist"))

        response = client.post("/videos/analyze", json=BODY)

        assert response.status_code == 500
        assert "analysis_jobs" not in response.text


class TestProgress:

    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_passes_through_every_step_in_order(self, _download, job_store):
        analyze(client, BODY)

        assert job_store.stages == [
            "queued", "downloading", "uploading", "watching", "writing", "done",
        ]

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_stops_at_the_step_that_failed(self, _download, mock_analyze, job_store):
        mock_analyze.side_effect = ContentBlockedError("SAFETY")

        outcome = analyze(client, BODY)

        assert job_store.stages == ["queued", "downloading", "failed"]
        assert outcome.status_code == 422


class TestReading:

    def test_answers_nothing_when_there_is_no_analysis(self):
        response = client.get("/videos/analyze")

        assert response.status_code == 200
        assert response.json() is None

    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_keeps_a_finished_analysis_until_it_is_saved(self, _download):
        """What used to be lost by leaving the page before saving."""
        analyze(client, BODY)

        again = client.get("/videos/analyze").json()

        assert again["stage"] == "done"
        assert again["result"]["titulo_sugerido"] == RESULT["titulo_sugerido"]
        assert again["result"]["url_original"] == URL
        assert again["error"] is None

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_says_why_an_analysis_failed(self, _download, mock_analyze):
        mock_analyze.side_effect = asyncio.TimeoutError()
        analyze(client, BODY)

        job = client.get("/videos/analyze").json()

        assert job["stage"] == "failed"
        assert job["error"]["status"] == 504
        assert "took too long" in job["error"]["detail"]
        assert job["result"] is None

    def test_requires_a_session(self, anonymous):
        assert client.get("/videos/analyze").status_code == 401


class TestDiscarding:

    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_forgets_a_finished_analysis(self, _download):
        analyze(client, BODY)

        response = client.delete("/videos/analyze")

        assert response.status_code == 204
        assert client.get("/videos/analyze").json() is None

    def test_is_harmless_when_there_is_nothing_to_forget(self):
        assert client.delete("/videos/analyze").status_code == 204

    def test_stops_the_analysis_this_server_is_running(self):
        task = MagicMock()

        with patch.dict(videos._running, {TEST_USER_ID: task, "someone-else": MagicMock()}):
            client.delete("/videos/analyze")

            task.cancel.assert_called_once()
            videos._running["someone-else"].cancel.assert_not_called()

    def test_requires_a_session(self, anonymous):
        assert client.delete("/videos/analyze").status_code == 401


class TestSavingTheResult:

    @patch("routers.videos.supabase")
    @patch("routers.videos.create_embedding", return_value=[0.1] * 768)
    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_clears_the_analysis_it_came_from(self, _download, _embedding, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            ("data", [{"id": "video-1"}]),
            ("count", None),
        )
        analyze(client, BODY)

        response = client.post("/videos", json=METADATA)

        assert response.status_code == 200
        assert client.get("/videos/analyze").json() is None

    @patch("routers.videos.supabase")
    @patch("routers.videos.create_embedding", return_value=[0.1] * 768)
    @patch("routers.videos.analyze_video_content", new=_analysis_with_steps)
    @patch("routers.videos.download_video", return_value=DOWNLOADED)
    def test_leaves_the_analysis_of_another_link_alone(self, _download, _embedding, mock_supabase):
        """A video typed in by hand must not cost the analysis waiting beside it."""
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            ("data", [{"id": "video-2"}]),
            ("count", None),
        )
        analyze(client, BODY)

        client.post("/videos", json={**METADATA, "url_original": "https://x.com/a/status/9"})

        assert client.get("/videos/analyze").json()["stage"] == "done"


class TestCancelling:

    def test_is_free_while_the_video_is_still_downloading(self):
        recorder = AsyncMock()

        async def scenario():
            waiting = asyncio.Event()

            async def stuck(_url):
                waiting.set()
                await asyncio.sleep(60)

            with patch("routers.videos.jobs", FakeJobs()), \
                 patch("routers.videos.record_event", new=recorder), \
                 patch("routers.videos._download", new=stuck):
                task = asyncio.create_task(
                    videos._run_analysis("job-1", TEST_USER_ID, VideoAnalysisRequest(url=URL))
                )
                await waiting.wait()
                task.cancel()
                await task

        asyncio.run(scenario())

        recorder.assert_not_awaited()

    def test_is_charged_once_the_video_reached_the_model(self):
        """Parity with before: from that point the tokens may have been spent."""
        recorder = AsyncMock()

        async def scenario():
            watching = asyncio.Event()

            async def stuck(*_args, **_kwargs):
                watching.set()
                await asyncio.sleep(60)

            with patch("routers.videos.jobs", FakeJobs()), \
                 patch("routers.videos.record_event", new=recorder), \
                 patch("routers.videos.download_video", return_value=DOWNLOADED), \
                 patch("routers.videos.analyze_video_content", new=stuck), \
                 patch("routers.videos._remove") as removed:
                task = asyncio.create_task(
                    videos._run_analysis("job-1", TEST_USER_ID, VideoAnalysisRequest(url=URL))
                )
                await watching.wait()
                task.cancel()
                await task

            return removed

        removed = asyncio.run(scenario())

        recorder.assert_awaited_once_with(
            TEST_USER_ID, "analysis", False, "cancelled", 0, 0, 0, while_pending=False
        )
        removed.assert_called_once_with(DOWNLOADED.path)


class TestLaunch:

    def test_runs_the_work_apart_and_forgets_it_when_done(self):
        async def scenario():
            finished = asyncio.Event()

            async def work():
                finished.set()

            await real_launch("user-1", work())
            registered = "user-1" in videos._running

            await finished.wait()
            await asyncio.sleep(0)

            return registered, "user-1" in videos._running

        assert asyncio.run(scenario()) == (True, False)

    def test_a_run_that_ends_late_does_not_forget_the_one_after_it(self):
        """A cancelled analysis can outlive the start of the next."""
        async def scenario():
            release = asyncio.Event()

            async def slow():
                await release.wait()

            async def quick():
                await asyncio.sleep(60)

            await real_launch("user-1", slow())
            await real_launch("user-1", quick())
            second = videos._running["user-1"]

            release.set()
            await asyncio.sleep(0.01)
            still_known = videos._running.get("user-1") is second

            second.cancel()
            return still_known

        assert asyncio.run(scenario()) is True
