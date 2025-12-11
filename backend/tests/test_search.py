from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

# decorator que substitui o objeto 'supabase' dentro do módulo 'main' por um falso (mock)
@patch("main.supabase")

# decorator que substitui a função de embedding para não gastar da API
@patch("services.embedding.embed_query")
def test_search_videos_success(mock_embed, mock_supabase):
    # 1. cenário (arrange)
    mock_embed.return_value = [0.1, 0.2, 0.3] 
    mock_response = MagicMock()
    mock_response.data = [
        {"id": "123", "titulo_video": "Teste", "resumo": "Resumo","url_original": "http://twitter.com/teste","similarity": 0.9}
    ]
    mock_supabase.rpc.return_value.execute.return_value = mock_response

    # 2. ação (act)
    payload = {
        "query": "python tutorial",
        "limit": 5,
        "threshold": 0.5
    }
    response = client.post("/search", json=payload)

    # 3. validar resultado (assert)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["titulo_video"] == "Teste"
    assert data[0]["url_original"] == "http://twitter.com/teste"
    
    # validar função de embedding com o texto certo
    mock_embed.assert_called_with("python tutorial")