from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


def _mock_rpc(mock_supabase, rows):
    mock_response = MagicMock()
    mock_response.data = rows
    mock_supabase.rpc.return_value.execute.return_value = mock_response
    return mock_response


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_search_videos_success(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [
        {
            "id": "123",
            "titulo_video": "Teste",
            "descricao_completa": "Descrição completa do vídeo de teste",
            "url_original": "http://twitter.com/teste",
            "similarity": 0.9,
            "text_rank": 0.0,
            "score": 0.0196,
        }
    ])

    payload = {
        "query": "python tutorial",
        "limit": 5,
        "threshold": 0.5
    }
    response = client.post("/search", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["titulo_video"] == "Teste"
    assert data[0]["url_original"] == "http://twitter.com/teste"

    mock_embed.assert_called_with("python tutorial")


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_text_only_match_is_not_filtered_out(mock_embed, mock_supabase):
    """Regression: the Python-side similarity filter used to discard every
    full-text match, collapsing the hybrid search into a vector-only one."""
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [
        {
            "id": "abc",
            "titulo_video": "Show da banda",
            "descricao_completa": "Uma descrição qualquer sem relação semântica",
            "url_original": "http://twitter.com/show",
            # Came in through the full-text branch alone: zero similarity,
            # which sits below the requested threshold.
            "similarity": 0.0,
            "text_rank": 0.83,
            "score": 0.0196,
        }
    ])

    response = client.post("/search", json={"query": "banda", "threshold": 0.6})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1, "full-text match was dropped by the vector threshold"
    assert data[0]["id"] == "abc"
    assert data[0]["text_rank"] == 0.83


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_negative_similarity_is_accepted(mock_embed, mock_supabase):
    """Cosine similarity ranges over [-1, 1]. SearchResult used to validate it
    as ge=0.0, so a row whose embedding points away from the query would fail
    response validation and surface as a 500 instead of a result."""
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [
        {
            "id": "neg",
            "titulo_video": "Vídeo com embedding oposto",
            "descricao_completa": "Conteúdo sem relação semântica com a busca",
            "url_original": "http://twitter.com/oposto",
            "similarity": -0.42,
            "text_rank": 0.61,
            "score": 0.0196,
        }
    ])

    response = client.post("/search", json={"query": "teste"})

    assert response.status_code == 200
    assert response.json()[0]["similarity"] == -0.42


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_search_forwards_mode_to_rpc(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [])

    response = client.post("/search", json={"query": "teste", "mode": "semantic"})

    assert response.status_code == 200
    _, rpc_params = mock_supabase.rpc.call_args[0]
    assert rpc_params["search_mode"] == "semantic"


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_search_defaults_to_hybrid_mode(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [])

    response = client.post("/search", json={"query": "teste"})

    assert response.status_code == 200
    _, rpc_params = mock_supabase.rpc.call_args[0]
    assert rpc_params["search_mode"] == "hybrid"


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_text_mode_skips_embedding_generation(mock_embed, mock_supabase):
    """In text mode the RPC caps the vector branch with LIMIT 0, so paying for
    an embedding on every search would be pure waste."""
    _mock_rpc(mock_supabase, [])

    response = client.post("/search", json={"query": "capivara", "mode": "text"})

    assert response.status_code == 200
    mock_embed.assert_not_called()

    _, rpc_params = mock_supabase.rpc.call_args[0]
    assert rpc_params["search_mode"] == "text"
    # The signature still demands a vector(768); anything shorter is rejected
    # by Postgres before the LIMIT 0 ever applies.
    assert len(rpc_params["query_embedding"]) == 768
    assert set(rpc_params["query_embedding"]) == {0.0}


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_non_text_modes_still_embed(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, [])

    for mode in ("hybrid", "semantic"):
        mock_embed.reset_mock()
        response = client.post("/search", json={"query": "capivara", "mode": mode})

        assert response.status_code == 200
        mock_embed.assert_called_once_with("capivara")


def test_search_rejects_unknown_mode():
    response = client.post("/search", json={"query": "teste", "mode": "magica"})
    assert response.status_code == 422


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_search_handles_empty_rpc_response(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3]
    _mock_rpc(mock_supabase, None)

    response = client.post("/search", json={"query": "nada"})

    assert response.status_code == 200
    assert response.json() == []
