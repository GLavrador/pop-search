from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app
from tests.conftest import TEST_USER_ID

client = TestClient(app)

VALID_VIDEO = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "url_original": "https://twitter.com/user/status/123",
    "metadados_estruturados": {},
}


@patch("routers.videos.supabase")
@patch("routers.videos.create_embedding")
def test_saving_records_the_signed_in_user_as_owner(mock_embedding, mock_supabase):
    mock_embedding.return_value = [0.1] * 768
    mock_supabase.table.return_value.insert.return_value.execute.return_value = (
        ("data", [{"id": "video-1"}]),
        ("count", None),
    )

    response = client.post("/videos", json=VALID_VIDEO)

    assert response.status_code == 200
    payload = mock_supabase.table.return_value.insert.call_args[0][0]
    assert payload["user_id"] == TEST_USER_ID


@patch("routers.me.supabase")
def test_listing_returns_only_the_callers_videos(mock_supabase):
    """service_role ignores RLS, so this filter is the only thing separating
    one user's library from another's."""
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.order.return_value.limit.return_value.execute.return_value.data = []

    response = client.get("/me/videos")

    assert response.status_code == 200
    mock_supabase.table.return_value.select.return_value.eq.assert_called_once_with(
        "user_id", TEST_USER_ID
    )


@patch("routers.me.supabase")
def test_listing_maps_rows_to_the_response_model(mock_supabase):
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.order.return_value.limit.return_value.execute.return_value.data = [
        {
            "id": "video-1",
            "titulo_video": "Capivara nadando",
            "descricao_completa": "Uma capivara atravessa o rio",
            "url_original": "https://twitter.com/user/status/1",
            "created_at": "2026-08-11T12:00:00+00:00",
        }
    ]

    body = client.get("/me/videos").json()

    assert len(body) == 1
    assert body[0]["titulo_video"] == "Capivara nadando"


@patch("routers.me.supabase")
def test_listing_tolerates_an_empty_library(mock_supabase):
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.order.return_value.limit.return_value.execute.return_value.data = None

    response = client.get("/me/videos")

    assert response.status_code == 200
    assert response.json() == []
