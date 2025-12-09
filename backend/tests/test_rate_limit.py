from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

@patch("services.embedding.embed_query")
@patch("main.supabase")
def test_search_rate_limit(mock_supabase, mock_embed):
    mock_embed.return_value = [0.1] * 768
    mock_supabase.rpc.return_value.execute.return_value.data = []
    
    payload = {"query": "test", "limit": 1}
    
    for i in range(20):
        response = client.post("/search", json=payload)
        if response.status_code == 429:
            assert False, f"Rate limit triggered too early at request {i+1}"
        assert response.status_code == 200

    response = client.post("/search", json=payload)
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.text