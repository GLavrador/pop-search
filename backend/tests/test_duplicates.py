from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from services import archive
from services.archive import video_key
from services.usage import Quota

client = TestClient(app)

URL = "https://x.com/alguem/status/2085904884084478151"

ARCHIVED = {
    "id": "video-1",
    "titulo_video": "Gatinho deitado lambendo o planeta",
    "url_original": "https://twitter.com/outro/status/2085904884084478151/video/1",
    "created_at": "2026-08-01T12:00:00+00:00",
}

METADATA = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "url_original": URL,
    "metadados_estruturados": {},
}


class TestVideoKey:
    """The same video reaches the archive under many spellings of its link."""

    @pytest.mark.parametrize("url", [
        "https://x.com/alguem/status/2085904884084478151",
        "https://twitter.com/alguem/status/2085904884084478151",
        "https://x.com/outro/status/2085904884084478151",
        "https://x.com/alguem/status/2085904884084478151?s=20&t=abc",
        "https://x.com/alguem/status/2085904884084478151/video/1",
        "https://mobile.twitter.com/alguem/status/2085904884084478151/",
        "https://x.com/i/status/2085904884084478151",
    ])
    def test_reads_every_spelling_as_the_same_video(self, url):
        assert video_key(url) == ("2085904884084478151", "1")

    def test_tells_the_videos_of_one_post_apart(self):
        assert video_key(f"{URL}/video/2") != video_key(f"{URL}/video/1")

    def test_tells_posts_apart(self):
        assert video_key("https://x.com/a/status/123") != video_key("https://x.com/a/status/1234")

    def test_has_no_key_for_a_link_that_is_not_a_post(self):
        assert video_key("https://x.com/alguem") is None


def _archive_holding(rows):
    supabase = MagicMock()
    query = supabase.table.return_value.select.return_value
    query.like.return_value.limit.return_value.execute.return_value.data = rows
    query.eq.return_value.limit.return_value.execute.return_value.data = rows
    return supabase, query


class TestFindExisting:

    def test_finds_the_video_under_another_spelling(self):
        supabase, query = _archive_holding([ARCHIVED])

        with patch("services.archive.supabase", supabase):
            found = archive._find_existing(URL)

        assert found == ARCHIVED
        query.like.assert_called_once_with("url_original", "%/status/2085904884084478151%")

    def test_is_not_fooled_by_a_longer_id_that_starts_the_same(self):
        lookalike = {**ARCHIVED, "url_original": "https://x.com/a/status/20859048840844781519"}
        supabase, _ = _archive_holding([lookalike])

        with patch("services.archive.supabase", supabase):
            assert archive._find_existing(URL) is None

    def test_lets_another_video_of_the_same_post_through(self):
        second = {**ARCHIVED, "url_original": f"{URL}/video/2"}
        supabase, _ = _archive_holding([second])

        with patch("services.archive.supabase", supabase):
            assert archive._find_existing(URL) is None

    def test_compares_a_link_it_cannot_read_as_written(self):
        odd = "https://x.com/alguem"
        supabase, query = _archive_holding([{**ARCHIVED, "url_original": odd}])

        with patch("services.archive.supabase", supabase):
            found = archive._find_existing(odd)

        assert found["url_original"] == odd
        query.eq.assert_called_once_with("url_original", odd)

    def test_answers_none_when_the_archive_cannot_be_read(self):
        import asyncio

        supabase = MagicMock()
        supabase.table.side_effect = RuntimeError("connection reset")

        with patch("services.archive.supabase", supabase):
            assert asyncio.run(archive.find_existing(URL)) is None


class TestAnalysingACopy:
    """A copy used to cost an analysis and end in a generic error on save."""

    def test_is_refused_with_the_video_already_there(self):
        with patch("routers.videos.find_existing", new=AsyncMock(return_value=ARCHIVED)):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 409
        assert "already in the archive" in response.json()["detail"]
        assert response.json()["existing"] == ARCHIVED

    @patch("routers.videos.download_video")
    def test_costs_nothing(self, mock_download):
        recorder = AsyncMock()

        with patch("routers.videos.find_existing", new=AsyncMock(return_value=ARCHIVED)), \
             patch("routers.videos.record_event", new=recorder):
            response = client.post("/videos/analyze", json={"url": URL})

        assert "Nothing was taken from your quota" in response.json()["detail"]
        mock_download.assert_not_called()
        recorder.assert_not_awaited()

    def test_is_reported_even_to_someone_out_of_quota(self):
        """It is the more useful answer: the video is there to be searched."""
        exhausted = Quota(used=20, limit=20, resets_at="2026-09-01T00:00:00+00:00")

        with patch("routers.videos.find_existing", new=AsyncMock(return_value=ARCHIVED)), \
             patch("routers.videos.get_quota", new=AsyncMock(return_value=exhausted)):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 409


class TestSavingACopy:

    @patch("routers.videos.supabase")
    @patch("routers.videos.create_embedding")
    def test_is_refused_before_anything_is_spent(self, mock_embedding, mock_supabase):
        with patch("routers.videos.find_existing", new=AsyncMock(return_value=ARCHIVED)):
            response = client.post("/videos", json=METADATA)

        assert response.status_code == 409
        assert response.json()["existing"]["id"] == "video-1"
        mock_embedding.assert_not_called()
        mock_supabase.table.assert_not_called()
