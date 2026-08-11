"""Tests for Supabase token verification."""
import time

import jwt
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from unittest.mock import patch

from core import auth
from main import app

client = TestClient(app)

SECRET = "a-test-secret-that-is-not-the-real-one"


def _token(secret: str = SECRET, **overrides) -> str:
    claims = {
        "sub": "user-123",
        "aud": auth.JWT_AUDIENCE,
        "exp": int(time.time()) + 3600,
        **overrides,
    }
    return jwt.encode(claims, secret, algorithm="HS256")


class _Request:
    """Only .headers is touched by the functions under test."""

    def __init__(self, authorization: str | None = None):
        self.headers = {"Authorization": authorization} if authorization else {}


@pytest.fixture(autouse=True)
def _configured_secret():
    with patch.object(auth, "SUPABASE_JWT_SECRET", SECRET):
        yield


class TestCurrentUser:

    def test_accepts_a_valid_token(self):
        assert auth.current_user(_Request(f"Bearer {_token()}")) == "user-123"

    def test_is_case_insensitive_about_the_scheme(self):
        assert auth.current_user(_Request(f"bearer {_token()}")) == "user-123"

    def test_rejects_a_missing_header(self):
        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request())
        assert exc.value.status_code == 401

    def test_rejects_another_scheme(self):
        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request("Basic dXNlcjpwYXNz"))
        assert exc.value.status_code == 401

    def test_rejects_a_token_signed_with_another_key(self):
        """The whole point of verifying: a token someone else minted must not
        be accepted just because it is well formed."""
        forged = _token(secret="a-different-secret-long-enough-for-hs256")

        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request(f"Bearer {forged}"))
        assert exc.value.status_code == 401

    def test_rejects_an_expired_token_with_a_distinct_message(self):
        expired = _token(exp=int(time.time()) - 60)

        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request(f"Bearer {expired}"))

        assert exc.value.status_code == 401
        assert "expired" in exc.value.detail.lower()

    def test_rejects_a_token_for_another_audience(self):
        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request(f"Bearer {_token(aud='someone-else')}"))
        assert exc.value.status_code == 401

    def test_rejects_a_verified_token_with_no_subject(self):
        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request(f"Bearer {_token(sub=None)}"))
        assert exc.value.status_code == 401

    def test_rejects_a_token_that_declares_another_algorithm(self):
        """The accepted algorithm is pinned server-side. A token that picks its
        own is the entry point for algorithm-confusion attacks."""
        unsigned = jwt.encode(
            {"sub": "user-123", "aud": auth.JWT_AUDIENCE},
            key="",
            algorithm="none",
        )

        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request(f"Bearer {unsigned}"))
        assert exc.value.status_code == 401

    def test_never_leaks_why_the_token_failed(self):
        """The reason is useful to us in the log and useful to an attacker
        probing what the server accepts."""
        with pytest.raises(HTTPException) as exc:
            auth.current_user(_Request("Bearer not-even-a-token"))

        assert "signature" not in exc.value.detail.lower()
        assert "decode" not in exc.value.detail.lower()


class TestRouteProtection:
    """Contributing costs the project's Gemini quota; searching does not."""

    def test_analyze_requires_a_session(self, anonymous):
        response = client.post(
            "/videos/analyze", json={"url": "https://twitter.com/user/status/123"}
        )
        assert response.status_code == 401

    def test_saving_requires_a_session(self, anonymous):
        response = client.post("/videos", json={
            "titulo_sugerido": "Um titulo valido",
            "descricao_completa": "Uma descricao suficientemente longa para validar",
            "url_original": "https://twitter.com/user/status/123",
            "metadados_estruturados": {},
        })
        assert response.status_code == 401

    def test_listing_my_videos_requires_a_session(self, anonymous):
        assert client.get("/me/videos").status_code == 401

    @patch("routers.search.supabase")
    @patch("routers.search.embed_query")
    def test_search_stays_open_to_visitors(self, mock_embed, mock_supabase, anonymous):
        mock_embed.return_value = [0.1, 0.2, 0.3]
        mock_supabase.rpc.return_value.execute.return_value.data = []

        assert client.post("/search", json={"query": "capivara"}).status_code == 200


class TestCurrentUserOptional:
    """Used by routes that serve visitors and members alike, so a bad token has
    to degrade to 'anonymous' rather than break the request."""

    def test_returns_the_user_for_a_valid_token(self):
        assert auth.current_user_optional(_Request(f"Bearer {_token()}")) == "user-123"

    def test_returns_none_without_a_header(self):
        assert auth.current_user_optional(_Request()) is None

    def test_returns_none_instead_of_raising_on_a_bad_token(self):
        assert auth.current_user_optional(_Request("Bearer garbage")) is None

    def test_returns_none_for_an_expired_session(self):
        """Search must keep working for someone whose session quietly expired."""
        expired = _token(exp=int(time.time()) - 60)

        assert auth.current_user_optional(_Request(f"Bearer {expired}")) is None
