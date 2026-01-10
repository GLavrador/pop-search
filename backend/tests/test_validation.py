from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from core.exceptions import validate_video_url, ALLOWED_DOMAINS

client = TestClient(app)


class TestURLValidation:
    
    def test_valid_twitter_url(self):
        assert validate_video_url("https://twitter.com/user/status/123") is True
        
    def test_valid_x_url(self):
        assert validate_video_url("https://x.com/user/status/123") is True
        
    def test_invalid_random_url(self):
        assert validate_video_url("https://malicious-site.com/video") is False
        assert validate_video_url("https://example.com/video.mp4") is False
        assert validate_video_url("https://youtube.com/watch?v=abc123") is False
        assert validate_video_url("https://m.youtube.com/watch?v=abc123") is False
        assert validate_video_url("https://youtu.be/abc123") is False
        
    def test_invalid_similar_domain(self):
        assert validate_video_url("https://faketwitter.com/video") is False
        assert validate_video_url("https://notx.com/video") is False
        
    def test_analyze_rejects_invalid_url(self):
        response = client.post("/videos/analyze", json={"url": "https://malicious.com/video"})
        assert response.status_code == 422
        assert "URL must be from" in response.text


class TestErrorHandling:    
    @patch("routers.videos.download_video")
    def test_analyze_hides_internal_errors(self, mock_download):
        mock_download.side_effect = Exception("Sensitive database error: connection failed to postgres:5432")
        
        response = client.post("/videos/analyze", json={"url": "https://twitter.com/user/status/123"})
        
        assert response.status_code == 500
        assert "postgres" not in response.text
        assert "database" not in response.text.lower()
        assert "internal error" in response.text.lower()
    
    @patch("routers.search.supabase")
    @patch("routers.search.embed_query")
    def test_search_hides_internal_errors(self, mock_embed, mock_supabase):

        mock_embed.side_effect = Exception("API key invalid: sk-abc123")
        
        response = client.post("/search", json={"query": "test"})
        
        assert response.status_code == 500
        assert "sk-" not in response.text
        assert "API key" not in response.text
        assert "internal error" in response.text.lower()
