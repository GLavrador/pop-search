from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

@patch("main.supabase")
@patch("main.embed_query")
def test_search_videos_success(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1, 0.2, 0.3] 
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": "123", 
            "titulo_video": "Teste", 
            "descricao_completa": "Descrição completa do vídeo de teste",
            "resumo": "Resumo",  
            "url_original": "http://twitter.com/teste",
            "similarity": 0.9
        }
    ]
    mock_supabase.rpc.return_value.execute.return_value = mock_response

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