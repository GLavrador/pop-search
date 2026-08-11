"""Tests for the prompt contract, blocked responses and cost accounting."""
import asyncio
import pytest
from unittest.mock import MagicMock, patch

from core.exceptions import ContentBlockedError
from dtos import (
    MAX_ELEMENTOS_CENARIO,
    MAX_PESSOAS,
    MAX_TITULO_CHARS,
    MAX_TRANSCRICAO_CHARS,
)
from services.ai import (
    analyze_video_content,
    get_system_prompt,
    _extract_json,
    _log_token_usage,
)


class TestSystemPrompt:
    """The prompt is the only thing that stops Gemini from returning output the
    DTOs will reject, throwing away a paid call and a finished download."""

    def test_states_every_limit_for_the_requested_sections(self):
        prompt = get_system_prompt(analyze_scenes=True, analyze_audio=True)

        assert str(MAX_TITULO_CHARS) in prompt
        assert str(MAX_PESSOAS) in prompt
        assert str(MAX_ELEMENTOS_CENARIO) in prompt
        assert str(MAX_TRANSCRICAO_CHARS) in prompt

    def test_omits_limits_for_sections_that_were_not_requested(self):
        prompt = get_system_prompt(analyze_scenes=False, analyze_audio=False)

        assert "pessoas: no máximo" not in prompt
        assert "elementos_cenario: no máximo" not in prompt
        assert "transcricao: no máximo" not in prompt
        assert "titulo_sugerido: no máximo" in prompt
        assert "descricao_completa: no máximo" in prompt


def _response(finish_reason: str = "STOP", text: str = '{"ok": true}'):
    candidate = MagicMock()
    candidate.finish_reason.name = finish_reason

    response = MagicMock()
    response.candidates = [candidate]
    response.text = text
    return response


class _ResponseThatRaisesOnText:
    """Mirrors the SDK: reading .text on a blocked candidate raises."""

    def __init__(self, finish_reason: str):
        candidate = MagicMock()
        candidate.finish_reason.name = finish_reason
        self.candidates = [candidate]

    @property
    def text(self):
        raise ValueError("accessing .text without a valid candidate raises")


class TestExtractJson:

    def test_parses_a_normally_finished_response(self):
        assert _extract_json(_response()) == {"ok": True}

    def test_accepts_a_truncated_but_usable_response(self):
        assert _extract_json(_response(finish_reason="MAX_TOKENS")) == {"ok": True}

    def test_raises_when_there_is_no_candidate(self):
        response = MagicMock()
        response.candidates = []
        response.prompt_feedback.block_reason = "SAFETY"

        with pytest.raises(ContentBlockedError):
            _extract_json(response)

    def test_reports_the_finish_reason_that_blocked_it(self):
        with pytest.raises(ContentBlockedError) as exc:
            _extract_json(_response(finish_reason="SAFETY"))

        assert exc.value.reason == "SAFETY"

    def test_never_reads_text_when_the_candidate_is_unusable(self):
        """Regression: reading .text on a blocked candidate used to raise inside
        the broad except, turning a content filter into a generic 500."""
        with pytest.raises(ContentBlockedError):
            _extract_json(_ResponseThatRaisesOnText("RECITATION"))


class TestTokenUsageLogging:
    """These numbers are what per-user metering will be built on, so they have
    to be emitted for every call and they have to be complete."""

    def test_logs_the_counts_reported_by_gemini(self):
        response = _response()
        response.usage_metadata.prompt_token_count = 8123
        response.usage_metadata.candidates_token_count = 250
        response.usage_metadata.total_token_count = 8373

        with patch("services.ai.logger") as mock_logger:
            _log_token_usage(response)

        message = mock_logger.info.call_args[0][0]
        assert "prompt=8123" in message
        assert "output=250" in message
        assert "total=8373" in message

    def test_warns_instead_of_crashing_when_usage_is_missing(self):
        response = MagicMock()
        response.usage_metadata = None

        with patch("services.ai.logger") as mock_logger:
            _log_token_usage(response)

        mock_logger.warning.assert_called_once()
        mock_logger.info.assert_not_called()

    def test_records_the_cost_even_when_the_content_is_blocked(self):
        """A blocked video still burned its input tokens. Recording the cost
        only on success would make per-user accounting under-count silently."""
        uploaded = MagicMock()
        uploaded.state.name = "ACTIVE"

        blocked = _response(finish_reason="SAFETY")
        blocked.usage_metadata.prompt_token_count = 8000
        blocked.usage_metadata.candidates_token_count = 0
        blocked.usage_metadata.total_token_count = 8000

        async def _generate(*_args, **_kwargs):
            return blocked

        with patch("services.ai.genai") as mock_genai, \
             patch("services.ai.model") as mock_model, \
             patch("services.ai.logger") as mock_logger:
            mock_genai.upload_file.return_value = uploaded
            mock_model.generate_content_async = _generate

            with pytest.raises(ContentBlockedError):
                asyncio.run(analyze_video_content("fake.mp4"))

        logged = " ".join(str(call) for call in mock_logger.info.call_args_list)
        assert "prompt=8000" in logged
