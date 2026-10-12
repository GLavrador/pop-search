from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from dtos import MAX_POST_TEXTO_CHARS, PostInfo
from main import app
from services.downloader import Download, read_post
from tests.conftest import analyze

client = TestClient(app)

URL = "https://x.com/larissa/status/123"
THUMBNAIL = "https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg"

INFO = {
    "title": "larissa - dia de meia maluca",
    "description": "dia de meia maluca  https://t.co/bC6wOFwGqp",
    "uploader": "larissa",
    "uploader_id": "ilfillorosso",
    "thumbnail": f"{THUMBNAIL}?name=orig",
    "thumbnails": [
        {"id": "thumb", "url": f"{THUMBNAIL}?name=thumb"},
        {"id": "small", "url": f"{THUMBNAIL}?name=small"},
        {"id": "orig", "url": f"{THUMBNAIL}?name=orig"},
    ],
}

POST = {
    "texto": "dia de meia maluca",
    "miniatura": f"{THUMBNAIL}?name=small",
}

ACCOUNT = {"autor": "larissa", "usuario": "ilfillorosso"}

RESULT = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "metadados_estruturados": {},
}

VIDEO = {**RESULT, "url_original": URL}


def _saved(mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value = (
        ("data", [{"id": "video-1"}]),
        ("count", None),
    )
    return lambda: mock_supabase.table.return_value.insert.call_args[0][0]


class TestReadingThePost:

    def test_keeps_the_text_and_the_picture_and_not_who_posted(self):
        assert read_post(INFO).model_dump() == POST

    def test_drops_the_short_link_x_puts_after_the_text(self):
        post = read_post({**INFO, "description": "olha isso https://t.co/abc\nsegunda linha https://t.co/def"})

        assert post.texto == "olha isso\nsegunda linha"

    def test_takes_the_largest_picture_when_there_is_no_small_one(self):
        post = read_post({**INFO, "thumbnails": []})

        assert post.miniatura == f"{THUMBNAIL}?name=orig"

    def test_reads_a_post_with_several_videos_from_the_first(self):
        post = read_post({
            "description": "dois videos https://t.co/abc",
            "uploader": "larissa",
            "uploader_id": "ilfillorosso",
            "entries": [{"thumbnail": f"{THUMBNAIL}?name=orig"}, {"thumbnail": "https://pbs.twimg.com/b.jpg"}],
        })

        assert (post.texto, post.miniatura) == ("dois videos", f"{THUMBNAIL}?name=orig")

    def test_cuts_a_text_longer_than_the_limit(self):
        post = read_post({**INFO, "description": "a" * (MAX_POST_TEXTO_CHARS + 500)})

        assert len(post.texto) == MAX_POST_TEXTO_CHARS

    def test_is_nothing_when_the_post_has_neither(self):
        assert read_post({"uploader": "larissa", "description": " https://t.co/abc"}) is None

    @pytest.mark.parametrize("info", [
        {"thumbnails": "not-a-list", "description": 5},
        {"entries": [None]},
        {"uploader": ["a"], "thumbnails": [None]},
    ])
    def test_never_fails_the_download_over_an_odd_answer(self, info):
        assert read_post(info) is None


class TestThumbnailAddress:
    """Every visitor's browser loads it, so it is only ever an image of X."""

    @pytest.mark.parametrize("address", [
        "http://pbs.twimg.com/a.jpg",
        "https://example.com/a.jpg",
        "https://pbs.twimg.com.example.com/a.jpg",
        "https://eviltwimg.com/a.jpg",
        "javascript:alert(1)",
        "",
    ])
    def test_drops_an_address_outside_x(self, address):
        assert PostInfo(miniatura=address).miniatura is None

    def test_keeps_an_image_of_x(self):
        assert PostInfo(miniatura=THUMBNAIL).miniatura == THUMBNAIL

    def test_drops_it_from_a_save_without_refusing_the_video(self):
        with patch("routers.videos.supabase") as mock_supabase, \
             patch("routers.videos.create_embedding", return_value=[0.1] * 768):
            payload = _saved(mock_supabase)

            response = client.post("/videos", json={**VIDEO, "post": {**POST, "miniatura": "https://example.com/a.jpg"}})

        assert response.status_code == 200
        assert payload()["post"] == {**POST, "miniatura": None}


class TestAnalysis:

    @patch("routers.videos.analyze_video_content", return_value=dict(RESULT))
    @patch("routers.videos.download_video", return_value=Download("does-not-exist.mp4", PostInfo(**POST)))
    def test_hands_the_post_over_with_the_result(self, _download, _analysis):
        outcome = analyze(client, {"url": URL})

        assert outcome.json()["post"] == POST

    @patch("routers.videos.analyze_video_content", return_value=dict(RESULT))
    @patch("routers.videos.download_video", return_value=Download("does-not-exist.mp4"))
    def test_finishes_without_one(self, _download, _analysis):
        outcome = analyze(client, {"url": URL})

        assert outcome.status_code == 200
        assert outcome.json()["post"] is None


@patch("routers.videos.create_embedding", return_value=[0.1] * 768)
@patch("routers.videos.supabase")
class TestSaving:

    def test_stores_the_post_that_came_with_the_analysis(self, mock_supabase, _embedding):
        payload = _saved(mock_supabase)

        response = client.post("/videos", json={**VIDEO, "post": POST})

        assert response.status_code == 200
        assert payload()["post"] == POST

    def test_embeds_the_text_of_the_post(self, mock_supabase, mock_embedding):
        _saved(mock_supabase)

        client.post("/videos", json={**VIDEO, "post": POST})

        assert mock_embedding.call_args[0][0].post.texto == "dia de meia maluca"

    def test_saves_a_video_that_came_without_one(self, mock_supabase, _embedding):
        payload = _saved(mock_supabase)

        response = client.post("/videos", json=VIDEO)

        assert response.status_code == 200
        assert payload()["post"] is None

    def test_stores_the_text_as_it_was_left_in_the_form(self, mock_supabase, mock_embedding):
        payload = _saved(mock_supabase)

        client.post("/videos", json={**VIDEO, "post": {**POST, "texto": "  so isto  "}})

        assert payload()["post"]["texto"] == "so isto"
        assert mock_embedding.call_args[0][0].post.texto == "so isto"

    def test_keeps_the_picture_of_a_post_whose_text_was_cleared(self, mock_supabase, _embedding):
        payload = _saved(mock_supabase)

        client.post("/videos", json={**VIDEO, "post": {**POST, "texto": ""}})

        assert payload()["post"] == {**POST, "texto": ""}

    def test_stores_no_post_at_all_when_nothing_of_it_is_left(self, mock_supabase, _embedding):
        payload = _saved(mock_supabase)

        client.post("/videos", json={**VIDEO, "post": {"texto": "   ", "miniatura": None}})

        assert payload()["post"] is None

    def test_never_stores_who_posted(self, mock_supabase, _embedding):
        payload = _saved(mock_supabase)

        client.post("/videos", json={**VIDEO, "post": {**POST, **ACCOUNT}})

        assert payload()["post"] == POST


class TestReadingItBack:

    @patch("routers.search.supabase")
    @patch("routers.search.embed_query", return_value=[0.1] * 768)
    def test_comes_with_a_search_result(self, _embed, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = [{
            "id": "video-1",
            "titulo_video": "Um titulo",
            "descricao_completa": "Uma descricao",
            "url_original": URL,
            "similarity": 0.8,
            "text_rank": 0.0,
            "score": 0.02,
            "post": POST,
        }]

        response = client.post("/search", json={"query": "meia maluca"})

        assert response.json()[0]["post"] == POST

    @patch("routers.search.supabase")
    @patch("routers.search.embed_query", return_value=[0.1] * 768)
    def test_is_absent_from_a_video_saved_before_posts_were_kept(self, _embed, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = [{
            "id": "video-1",
            "titulo_video": "Um titulo",
            "url_original": URL,
            "similarity": 0.8,
            "post": None,
        }]

        response = client.post("/search", json={"query": "meia maluca"})

        assert response.status_code == 200
        assert response.json()[0]["post"] is None

    @patch("routers.me.supabase")
    def test_comes_with_my_videos(self, mock_supabase):
        chain = mock_supabase.table.return_value.select.return_value.eq.return_value
        chain.order.return_value.limit.return_value.execute.return_value.data = [{
            "id": "video-1",
            "titulo_video": "Um titulo",
            "descricao_completa": "Uma descricao",
            "url_original": URL,
            "created_at": "2026-08-11T12:00:00+00:00",
            "post": POST,
        }]

        response = client.get("/me/videos")

        assert response.json()[0]["post"] == POST
