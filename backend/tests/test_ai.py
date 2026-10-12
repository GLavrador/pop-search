"""Tests for the prompt contract, blocked responses and cost accounting."""
import asyncio
import pytest
from unittest.mock import MagicMock, patch

from core.exceptions import ContentBlockedError
from dtos import (
    MAX_DESCRICAO_CHARS,
    MAX_ELEMENTOS_CENARIO,
    MAX_PESSOAS,
    MAX_TITULO_CHARS,
    MAX_TRANSCRICAO_CHARS,
    VideoMetadataDTO,
)
from services.ai import (
    analyze_video_content,
    fit_to_limits,
    get_response_schema,
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


    def test_does_not_ask_for_metadata_the_schema_leaves_out(self):
        """Regression: asked for a key the schema did not allow, Gemini wrote
        until the output limit, on every request without scenes or audio."""
        prompt = get_system_prompt(analyze_scenes=False, analyze_audio=False)

        assert "metadados_estruturados" not in prompt

    @pytest.mark.parametrize("scenes", [True, False])
    @pytest.mark.parametrize("audio", [True, False])
    def test_shows_the_json_the_schema_describes(self, scenes, audio):
        import json

        prompt = get_system_prompt(scenes, audio)
        example = json.loads(prompt[prompt.index("{"):])
        schema = get_response_schema(scenes, audio)["properties"]
        sections = schema.get("metadados_estruturados", {}).get("properties", {})

        assert list(example) == sorted(schema)
        assert list(example.get("metadados_estruturados", {})) == sorted(sections)


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


class TestResponseSchema:
    """The prompt only asks for the shape. The schema is what holds Gemini to it."""

    def test_always_requires_the_title_and_the_description(self):
        schema = get_response_schema(analyze_scenes=False, analyze_audio=False)

        assert schema["required"] == ["titulo_sugerido", "descricao_completa"]

    def test_asks_only_for_the_sections_that_were_requested(self):
        scenes = get_response_schema(analyze_scenes=True, analyze_audio=False)
        audio = get_response_schema(analyze_scenes=False, analyze_audio=True)

        assert scenes["properties"]["metadados_estruturados"]["required"] == [
            "pessoas",
            "elementos_cenario",
        ]
        assert audio["properties"]["metadados_estruturados"]["required"] == ["audio"]

    def test_leaves_the_metadata_out_when_no_section_was_requested(self):
        """An object without properties is refused by the API."""
        schema = get_response_schema(analyze_scenes=False, analyze_audio=False)

        assert "metadados_estruturados" not in schema["properties"]

    def test_caps_the_lists_at_what_the_dto_accepts(self):
        sections = get_response_schema(True, True)["properties"]["metadados_estruturados"]["properties"]

        assert sections["pessoas"]["max_items"] == MAX_PESSOAS
        assert sections["elementos_cenario"]["max_items"] == MAX_ELEMENTOS_CENARIO

    @pytest.mark.parametrize("scenes", [True, False])
    @pytest.mark.parametrize("audio", [True, False])
    def test_is_a_schema_the_sdk_can_send(self, scenes, audio):
        from google.generativeai.types import generation_types

        config = generation_types.to_generation_config_dict(
            {"response_schema": get_response_schema(scenes, audio)}
        )

        assert "titulo_sugerido" in config["response_schema"].properties

    def test_goes_out_with_the_request(self):
        uploaded = MagicMock()
        uploaded.state.name = "ACTIVE"
        sent = {}

        async def _generate(_contents, **kwargs):
            sent.update(kwargs)
            return _response(text='{"titulo_sugerido": "t", "descricao_completa": "d"}')

        with patch("services.ai.genai") as mock_genai, patch("services.ai.model") as mock_model:
            mock_genai.upload_file.return_value = uploaded
            mock_model.generate_content_async = _generate

            asyncio.run(analyze_video_content("fake.mp4", analyze_scenes=True))

        assert sent["generation_config"]["response_schema"] == get_response_schema(True, False)


def _oversized() -> dict:
    return {
        "titulo_sugerido": "palavra " * 60,
        "descricao_completa": "frase longa " * 800,
        "metadados_estruturados": {
            "pessoas": [{"descricao": "x" * 900, "papel": "y" * 300}] * 40,
            "elementos_cenario": ["objeto"] * 120,
            "audio": {
                "transcricao": "fala " * 2000,
                "musica": "m" * 400,
                "artista": "a" * 400,
            },
        },
    }


class TestFitToLimits:
    """A title a few characters too long used to discard a paid analysis."""

    def test_makes_an_oversized_answer_valid(self):
        dto = VideoMetadataDTO(**fit_to_limits(_oversized()))

        assert len(dto.titulo_sugerido) <= MAX_TITULO_CHARS
        assert len(dto.descricao_completa) <= MAX_DESCRICAO_CHARS
        assert len(dto.metadados_estruturados.pessoas) == MAX_PESSOAS
        assert len(dto.metadados_estruturados.elementos_cenario) == MAX_ELEMENTOS_CENARIO
        assert len(dto.metadados_estruturados.audio.transcricao) <= MAX_TRANSCRICAO_CHARS

    def test_cuts_between_words(self):
        title = fit_to_limits(_oversized())["titulo_sugerido"]

        assert title.endswith("palavra")

    def test_leaves_an_answer_within_the_limits_untouched(self):
        answer = {
            "titulo_sugerido": "Gato dormindo no sofa",
            "descricao_completa": "Um gato cinza dorme no sofa da sala enquanto chove.",
            "metadados_estruturados": {
                "pessoas": [{"descricao": "Mulher de casaco azul", "papel": None}],
                "elementos_cenario": ["sofa", "janela"],
                "audio": {"transcricao": "", "musica": None, "artista": None},
            },
        }

        assert fit_to_limits(answer) == answer

    def test_drops_a_person_it_cannot_describe(self):
        answer = {
            "titulo_sugerido": "Gato dormindo no sofa",
            "descricao_completa": "Um gato cinza dorme no sofa da sala enquanto chove.",
            "metadados_estruturados": {
                "pessoas": [
                    {"descricao": "  ", "papel": None},
                    {"descricao": None},
                    {"descricao": "Homem de chapeu"},
                ],
            },
        }

        people = fit_to_limits(answer)["metadados_estruturados"]["pessoas"]

        assert [person["descricao"] for person in people] == ["Homem de chapeu"]

    def test_reads_a_missing_transcription_as_silence(self):
        answer = {
            "titulo_sugerido": "Gato dormindo no sofa",
            "descricao_completa": "Um gato cinza dorme no sofa da sala enquanto chove.",
            "metadados_estruturados": {"audio": {"transcricao": None}},
        }

        assert fit_to_limits(answer)["metadados_estruturados"]["audio"]["transcricao"] == ""

    def test_is_applied_to_what_the_analysis_returns(self):
        import json

        uploaded = MagicMock()
        uploaded.state.name = "ACTIVE"

        async def _generate(*_args, **_kwargs):
            return _response(text=json.dumps(_oversized()))

        with patch("services.ai.genai") as mock_genai, patch("services.ai.model") as mock_model:
            mock_genai.upload_file.return_value = uploaded
            mock_model.generate_content_async = _generate

            result = asyncio.run(analyze_video_content("fake.mp4", True, True))

        assert len(result["titulo_sugerido"]) <= MAX_TITULO_CHARS


class TestStages:

    def test_tells_each_step_as_it_begins(self):
        uploaded = MagicMock()
        uploaded.state.name = "ACTIVE"
        seen = []

        async def note(stage):
            seen.append(stage)

        async def _generate(*_args, **_kwargs):
            seen.append("asked the model")
            return _response(text='{"titulo_sugerido": "t", "descricao_completa": "d"}')

        with patch("services.ai.genai") as mock_genai, patch("services.ai.model") as mock_model:
            mock_genai.upload_file.side_effect = lambda **_: seen.append("sent the file") or uploaded
            mock_model.generate_content_async = _generate

            asyncio.run(analyze_video_content("fake.mp4", on_stage=note))

        assert seen == ["uploading", "sent the file", "watching", "writing", "asked the model"]

    def test_runs_without_anyone_listening(self):
        uploaded = MagicMock()
        uploaded.state.name = "ACTIVE"

        async def _generate(*_args, **_kwargs):
            return _response(text='{"titulo_sugerido": "t", "descricao_completa": "d"}')

        with patch("services.ai.genai") as mock_genai, patch("services.ai.model") as mock_model:
            mock_genai.upload_file.return_value = uploaded
            mock_model.generate_content_async = _generate

            assert asyncio.run(analyze_video_content("fake.mp4")) is not None
