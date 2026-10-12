from unittest.mock import patch

import pytest

from services import embedding
from services.embedding import embed_query

VECTOR = [0.1, 0.2, 0.3]


@pytest.fixture(autouse=True)
def forget_queries():
    embedding._embed_query.cache_clear()
    yield
    embedding._embed_query.cache_clear()


class TestQueryCache:
    """Changing only the precision or the mode repeats the search with the same
    text, and each repeat used to pay for the same embedding again."""

    def test_asks_gemini_once_for_a_repeated_query(self):
        with patch("services.embedding.genai") as mock_genai:
            mock_genai.embed_content.return_value = {"embedding": VECTOR}

            first = embed_query("gato dormindo")
            second = embed_query("gato dormindo")

        assert first == second == VECTOR
        mock_genai.embed_content.assert_called_once()

    def test_ignores_spacing_when_matching_a_query(self):
        with patch("services.embedding.genai") as mock_genai:
            mock_genai.embed_content.return_value = {"embedding": VECTOR}

            embed_query("gato dormindo")
            embed_query("  gato   dormindo ")

        mock_genai.embed_content.assert_called_once()

    def test_embeds_a_different_query_separately(self):
        with patch("services.embedding.genai") as mock_genai:
            mock_genai.embed_content.return_value = {"embedding": VECTOR}

            embed_query("gato dormindo")
            embed_query("cachorro correndo")

        assert mock_genai.embed_content.call_count == 2

    def test_does_not_remember_a_failure(self):
        with patch("services.embedding.genai") as mock_genai:
            mock_genai.embed_content.side_effect = [RuntimeError("quota"), {"embedding": VECTOR}]

            with pytest.raises(RuntimeError):
                embed_query("gato dormindo")

            assert embed_query("gato dormindo") == VECTOR

    def test_hands_out_a_list_the_caller_may_change(self):
        with patch("services.embedding.genai") as mock_genai:
            mock_genai.embed_content.return_value = {"embedding": VECTOR}

            embed_query("gato dormindo").append(9.9)

            assert embed_query("gato dormindo") == VECTOR
