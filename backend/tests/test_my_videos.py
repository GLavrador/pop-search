from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app
from tests.conftest import TEST_USER_ID

client = TestClient(app)

VIDEO_ID = "11111111-1111-4111-8111-111111111111"
URL = "https://x.com/larissa/status/123"

POST = {
    "texto": "dia de meia maluca",
    "miniatura": "https://pbs.twimg.com/a.jpg",
}

CHANGES = {
    "titulo_sugerido": "Um titulo corrigido",
    "descricao_completa": "Uma descricao corrigida e suficientemente longa",
    "metadados_estruturados": {"elementos_cenario": ["meia", "escola"]},
}

STORED = {"id": VIDEO_ID, "url_original": URL, "post": POST}

SAVED = {
    "id": VIDEO_ID,
    "titulo_video": "Um titulo corrigido",
    "descricao_completa": "Uma descricao corrigida e suficientemente longa",
    "url_original": URL,
    "created_at": "2026-08-11T12:00:00+00:00",
    "post": POST,
    "metadados_estruturados": {"pessoas": [], "elementos_cenario": ["meia", "escola"]},
    "embedding": "[0.1, 0.1]",
}


def _mine(mock_supabase, stored=STORED, saved=SAVED, deleted=True):
    """A library holding one video, or none of the caller's when `stored` is None."""
    table = mock_supabase.table.return_value
    owned = lambda action: action.return_value.eq.return_value.eq.return_value

    owned(table.select).limit.return_value.execute.return_value.data = [stored] if stored else []
    owned(table.update).execute.return_value.data = [saved] if saved else []
    owned(table.delete).execute.return_value.data = [{"id": VIDEO_ID}] if deleted else []
    return table


def _filters(action):
    return [call.args for call in (action.return_value.eq.call_args, action.return_value.eq.return_value.eq.call_args)]


@patch("routers.me.create_embedding", return_value=[0.1] * 768)
@patch("routers.me.supabase")
class TestEditing:

    def test_rewrites_the_text_and_embeds_it_again(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)

        response = client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES)

        assert response.status_code == 200
        written = table.update.call_args[0][0]
        assert written["titulo_video"] == "Um titulo corrigido"
        assert written["descricao_completa"] == "Uma descricao corrigida e suficientemente longa"
        assert written["metadados_estruturados"]["elementos_cenario"] == ["meia", "escola"]
        assert written["embedding"] == [0.1] * 768
        mock_embedding.assert_called_once()

    def test_answers_with_the_video_as_it_is_listed(self, mock_supabase, _embedding):
        _mine(mock_supabase)

        video = client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES).json()

        assert video["titulo_video"] == "Um titulo corrigido"
        assert video["post"] == POST
        assert "embedding" not in video

    def test_only_touches_a_video_of_the_caller(self, mock_supabase, _embedding):
        table = _mine(mock_supabase)

        client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES)

        owner = [("id", VIDEO_ID), ("user_id", TEST_USER_ID)]
        assert _filters(table.select) == owner
        assert _filters(table.update) == owner

    def test_leaves_the_link_and_the_picture_as_they_were_saved(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)
        forged = {
            **CHANGES,
            "url_original": "https://x.com/a/status/9",
            "post": {**POST, "miniatura": "https://pbs.twimg.com/another.jpg"},
        }

        client.put(f"/me/videos/{VIDEO_ID}", json=forged)

        written = table.update.call_args[0][0]
        assert "url_original" not in written
        assert written["post"] == POST
        assert mock_embedding.call_args[0][0].url_original == URL

    def test_rewrites_the_text_of_the_post(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)

        client.put(f"/me/videos/{VIDEO_ID}", json={**CHANGES, "post": {"texto": "meia maluca na escola"}})

        assert table.update.call_args[0][0]["post"] == {**POST, "texto": "meia maluca na escola"}
        assert mock_embedding.call_args[0][0].post.texto == "meia maluca na escola"

    def test_takes_the_text_of_the_post_out_of_the_search_when_it_is_cleared(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)

        client.put(f"/me/videos/{VIDEO_ID}", json={**CHANGES, "post": {"texto": ""}})

        assert table.update.call_args[0][0]["post"] == {**POST, "texto": ""}
        assert mock_embedding.call_args[0][0].post.texto == ""

    def test_stores_no_post_at_all_once_nothing_of_it_is_left(self, mock_supabase, _embedding):
        table = _mine(mock_supabase, stored={**STORED, "post": {"texto": "so texto", "miniatura": None}})

        client.put(f"/me/videos/{VIDEO_ID}", json={**CHANGES, "post": {"texto": ""}})

        assert table.update.call_args[0][0]["post"] is None

    def test_leaves_the_text_alone_when_the_request_says_nothing_of_the_post(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)

        client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES)

        assert table.update.call_args[0][0]["post"] == POST
        assert mock_embedding.call_args[0][0].post.texto == "dia de meia maluca"

    def test_edits_a_video_saved_before_posts_were_kept(self, mock_supabase, _embedding):
        table = _mine(mock_supabase, stored={**STORED, "post": None})

        response = client.put(f"/me/videos/{VIDEO_ID}", json={**CHANGES, "post": {"texto": "agora tem"}})

        assert response.status_code == 200
        assert table.update.call_args[0][0]["post"] == {"texto": "agora tem", "miniatura": None}

    def test_is_not_found_for_a_video_of_someone_else(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase, stored=None)

        response = client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES)

        assert response.status_code == 404
        mock_embedding.assert_not_called()
        table.update.assert_not_called()

    def test_is_not_found_when_the_video_went_away_meanwhile(self, mock_supabase, _embedding):
        _mine(mock_supabase, saved=None)

        assert client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES).status_code == 404

    def test_changes_nothing_when_the_embedding_fails(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)
        mock_embedding.side_effect = RuntimeError("embedding service down")

        response = client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES)

        assert response.status_code == 500
        assert "embedding service down" not in response.text
        table.update.assert_not_called()

    def test_refuses_text_too_short_to_search(self, mock_supabase, mock_embedding):
        table = _mine(mock_supabase)

        response = client.put(f"/me/videos/{VIDEO_ID}", json={**CHANGES, "titulo_sugerido": "Oi"})

        assert response.status_code == 422
        table.update.assert_not_called()

    def test_refuses_an_id_that_is_not_one(self, mock_supabase, _embedding):
        table = _mine(mock_supabase)

        assert client.put("/me/videos/not-an-id", json=CHANGES).status_code == 422
        table.select.assert_not_called()

    def test_requires_a_session(self, mock_supabase, _embedding, anonymous):
        assert client.put(f"/me/videos/{VIDEO_ID}", json=CHANGES).status_code == 401


@patch("routers.me.supabase")
class TestDeleting:

    def test_removes_the_video(self, mock_supabase):
        table = _mine(mock_supabase)

        response = client.delete(f"/me/videos/{VIDEO_ID}")

        assert response.status_code == 204
        assert _filters(table.delete) == [("id", VIDEO_ID), ("user_id", TEST_USER_ID)]

    def test_is_not_found_for_a_video_of_someone_else(self, mock_supabase):
        _mine(mock_supabase, deleted=False)

        assert client.delete(f"/me/videos/{VIDEO_ID}").status_code == 404

    def test_hides_the_cause_of_a_failure(self, mock_supabase):
        mock_supabase.table.side_effect = RuntimeError("connection refused")

        response = client.delete(f"/me/videos/{VIDEO_ID}")

        assert response.status_code == 500
        assert "connection refused" not in response.text

    def test_refuses_an_id_that_is_not_one(self, mock_supabase):
        assert client.delete("/me/videos/not-an-id").status_code == 422
        mock_supabase.table.assert_not_called()

    def test_requires_a_session(self, mock_supabase, anonymous):
        assert client.delete(f"/me/videos/{VIDEO_ID}").status_code == 401


@patch("routers.me.supabase")
class TestListing:

    def _rows(self, mock_supabase, rows):
        chain = mock_supabase.table.return_value.select.return_value.eq.return_value
        chain.order.return_value.limit.return_value.execute.return_value.data = rows

    def test_brings_what_the_edit_form_needs(self, mock_supabase):
        self._rows(mock_supabase, [SAVED])

        video = client.get("/me/videos").json()[0]

        assert video["metadados_estruturados"]["elementos_cenario"] == ["meia", "escola"]
        assert "embedding" not in video

    @pytest.mark.parametrize("metadata", [
        None,
        {},
        {"pessoas": [{"descricao": "x"}], "audio": {"transcricao": "a" * 9000}},
    ])
    def test_still_lists_a_video_saved_under_older_rules(self, mock_supabase, metadata):
        self._rows(mock_supabase, [{**SAVED, "metadados_estruturados": metadata}])

        assert client.get("/me/videos").status_code == 200
