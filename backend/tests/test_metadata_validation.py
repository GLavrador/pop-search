import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from unittest.mock import patch

from dtos import MAX_ELEMENTO_CENARIO_CHARS, VideoMetadataDTO
from main import app
from services.ai import fit_to_limits


VALID = {
    "titulo_sugerido": "Video",
    "descricao_completa": "D" * 20,
    "url_original": "https://example.com/video",
    "metadados_estruturados": {},
}


@pytest.mark.parametrize("url", ["not-a-url", "x.com/video", "ftp://example.com/video", "javascript:alert(1)", "https://", ""])
def test_rejects_invalid_original_urls_before_embedding(url):
    with patch("routers.videos.create_embedding") as embed:
        response = TestClient(app).post("/videos", json={**VALID, "url_original": url})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "url_original"]
    embed.assert_not_called()


@pytest.mark.parametrize("url", ["http://example.com/video", "https://x.com/a/status/1"])
def test_accepts_http_and_https_urls(url):
    assert VideoMetadataDTO(**{**VALID, "url_original": url}).url_original == url


@pytest.mark.parametrize("field", ["titulo_sugerido", "descricao_completa"])
def test_rejects_whitespace_only_required_text(field):
    with pytest.raises(ValidationError):
        VideoMetadataDTO(**{**VALID, field: " \t\n" * 20})


def test_trims_required_text_before_checking_length():
    dto = VideoMetadataDTO(**{**VALID, "titulo_sugerido": "  Video  ", "descricao_completa": "  " + "D" * 20 + "  "})
    assert dto.titulo_sugerido == "Video"
    assert dto.descricao_completa == "D" * 20
    with pytest.raises(ValidationError):
        VideoMetadataDTO(**{**VALID, "titulo_sugerido": "  abc  "})


@pytest.mark.parametrize("field,minimum,maximum", [("titulo_sugerido", 5, 200), ("descricao_completa", 20, 5000)])
def test_required_text_boundaries(field, minimum, maximum):
    for length in [minimum, maximum]:
        assert len(getattr(VideoMetadataDTO(**{**VALID, field: "x" * length}), field)) == length
    for length in [minimum - 1, maximum + 1]:
        with pytest.raises(ValidationError):
            VideoMetadataDTO(**{**VALID, field: "x" * length})


@pytest.mark.parametrize("length", [MAX_ELEMENTO_CENARIO_CHARS + 1, 100_000])
def test_rejects_oversized_scenario_items(length):
    with pytest.raises(ValidationError) as error:
        VideoMetadataDTO(**{**VALID, "metadados_estruturados": {"elementos_cenario": ["x" * length]}})
    assert error.value.errors()[0]["loc"] == ("metadados_estruturados", "elementos_cenario", 0)


def test_accepts_scenario_item_at_limit_and_fits_ai_output():
    raw = {**VALID, "metadados_estruturados": {"elementos_cenario": ["x" * 1000]}}
    fitted = VideoMetadataDTO(**fit_to_limits(raw))
    assert len(fitted.metadados_estruturados.elementos_cenario[0]) == MAX_ELEMENTO_CENARIO_CHARS
