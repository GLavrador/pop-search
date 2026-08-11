"""Tests for the prompt contract and the blocked-response handling."""
import pytest
from unittest.mock import MagicMock

from core.exceptions import ContentBlockedError
from dtos import (
    MAX_ELEMENTOS_CENARIO,
    MAX_PESSOAS,
    MAX_TITULO_CHARS,
    MAX_TRANSCRICAO_CHARS,
)
from services.ai import get_system_prompt, _extract_json


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
