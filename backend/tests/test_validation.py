from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from core.exceptions import validate_video_url, ALLOWED_DOMAINS, ContentBlockedError

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

    def test_rejection_message_only_advertises_supported_domains(self):
        """Regression: the message used to name youtube.com and youtu.be, which
        validate_video_url has never accepted, so a rejected user was told the
        link they pasted was supported."""
        response = client.post("/videos/analyze", json={"url": "https://youtube.com/watch?v=abc123"})

        assert response.status_code == 422

        message = response.json()["detail"][0]["msg"]

        for domain in ALLOWED_DOMAINS:
            assert domain in message
        assert "youtube" not in message.lower()
        assert "youtu.be" not in message.lower()


class TestErrorHandling:    
    @patch("routers.videos.download_video")
    def test_analyze_hides_internal_errors(self, mock_download):
        mock_download.side_effect = Exception("Sensitive database error: connection failed to postgres:5432")
        
        response = client.post("/videos/analyze", json={"url": "https://twitter.com/user/status/123"})
        
        assert response.status_code == 500
        assert "postgres" not in response.text
        assert "database" not in response.text.lower()
        assert "internal error" in response.text.lower()
    
    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_blocked_content_is_reported_as_such(self, mock_download, mock_analyze):
        """A safety filter is not an internal error: the link is fine and the
        user can tell the difference, so it must not collapse into a 500."""
        mock_download.return_value = "does-not-exist.mp4"
        mock_analyze.side_effect = ContentBlockedError("SAFETY")

        response = client.post(
            "/videos/analyze", json={"url": "https://twitter.com/user/status/123"}
        )

        assert response.status_code == 422
        assert "declined to describe" in response.text
        assert "SAFETY" not in response.text

    @patch("routers.search.supabase")
    @patch("routers.search.embed_query")
    def test_search_hides_internal_errors(self, mock_embed, mock_supabase):

        mock_embed.side_effect = Exception("API key invalid: sk-abc123")
        
        response = client.post("/search", json={"query": "test"})
        
        assert response.status_code == 500
        assert "sk-" not in response.text
        assert "API key" not in response.text
        assert "internal error" in response.text.lower()
