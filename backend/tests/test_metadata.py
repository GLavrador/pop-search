"""Tests for new metadata structure validation."""
import pytest
from dtos import (
    Pessoa, 
    AudioInfo, 
    MetadadosEstruturados, 
    VideoMetadataDTO
)
from services.embedding import MAX_EMBEDDING_CHARS, generate_searchable_text


class TestMetadataStructure:
    """Test the new simplified metadata DTOs."""
    
    def test_pessoa_model_basic(self):
        """Test Pessoa model with required field only."""
        pessoa = Pessoa(descricao="Homem de barba grisalha usando óculos")
        assert pessoa.descricao == "Homem de barba grisalha usando óculos"
        assert pessoa.papel is None
    
    def test_pessoa_model_with_role(self):
        """Test Pessoa model with optional role field."""
        pessoa = Pessoa(
            descricao="Mulher loira de vestido vermelho",
            papel="apresentadora"
        )
        assert pessoa.descricao == "Mulher loira de vestido vermelho"
        assert pessoa.papel == "apresentadora"
    
    def test_audio_info_defaults(self):
        """Test AudioInfo model with default values."""
        audio = AudioInfo()
        assert audio.transcricao == ""
        assert audio.musica is None
        assert audio.artista is None
    
    def test_audio_info_with_music(self):
        """Test AudioInfo model with music identification."""
        audio = AudioInfo(
            transcricao="Hoje eu acordei pensando em você",
            musica="Evidências",
            artista="Chitãozinho & Xororó"
        )
        assert audio.musica == "Evidências"
        assert audio.artista == "Chitãozinho & Xororó"
    
    def test_metadados_estruturados_defaults(self):
        """Test MetadadosEstruturados with default values."""
        meta = MetadadosEstruturados()
        assert meta.pessoas == []
        assert meta.elementos_cenario == []
    
    def test_video_metadata_dto_complete(self):
        """Test complete VideoMetadataDTO structure."""
        dto = VideoMetadataDTO(
            titulo_sugerido="Gato laranja comendo ração em tigela azul",
            descricao_completa="Gato laranja de pelo curto sentado em mesa de cozinha.",
            url_original="http://twitter.com/teste",
            metadados_estruturados=MetadadosEstruturados(
                pessoas=[],
                elementos_cenario=["mesa de cozinha", "tigela azul"],
                audio=AudioInfo(transcricao="")
            )
        )
        assert dto.titulo_sugerido == "Gato laranja comendo ração em tigela azul"
        assert len(dto.metadados_estruturados.elementos_cenario) == 2


class TestSearchableTextGeneration:
    """Test the generate_searchable_text function with new format."""
    
    def test_generate_with_full_metadata(self):
        """Test text generation with all fields populated."""
        dto = VideoMetadataDTO(
            titulo_sugerido="Gato laranja comendo ração",
            descricao_completa="Gato de pelo curto comendo em cozinha.",
            metadados_estruturados=MetadadosEstruturados(
                pessoas=[Pessoa(descricao="Mulher filmando", papel="dona")],
                elementos_cenario=["mesa", "tigela"],
                audio=AudioInfo(transcricao="Olha ele comendo!")
            )
        )
        
        text = generate_searchable_text(dto)
        
        assert "Title: Gato laranja comendo ração" in text
        assert "Description: Gato de pelo curto comendo em cozinha." in text
        assert "People: Mulher filmando" in text
        assert "Elements: mesa, tigela" in text
        assert "Audio: Olha ele comendo!" in text
    
    def test_generate_with_minimal_metadata(self):
        """Test text generation with only required fields."""
        dto = VideoMetadataDTO(
            titulo_sugerido="Vídeo simples",
            descricao_completa="Um vídeo qualquer com uma legenda qualquer que cumpra uns requisitos quaisquer de uma aplicação qualquer de uma pessoa qualquer em um lugar qualquer.",
            metadados_estruturados=MetadadosEstruturados()
        )
        
        text = generate_searchable_text(dto)
        
        assert "Title: Vídeo simples" in text
        assert "Description: Um vídeo qualquer com uma legenda qualquer que cumpra uns requisitos quaisquer de uma aplicação qualquer de uma pessoa qualquer em um lugar qualquer." in text
        assert "People:" not in text
        assert "Elements:" not in text


class TestSearchableTextTruncation:
    """The embedding model rejects inputs over 2048 tokens, so the payload
    must stay bounded no matter how verbose the AI output was."""

    @staticmethod
    def _maxed_out_dto() -> VideoMetadataDTO:
        """A DTO pushed to the largest payload the validators still allow."""
        return VideoMetadataDTO(
            titulo_sugerido="T" * 200,
            descricao_completa="D" * 5000,
            metadados_estruturados=MetadadosEstruturados(
                pessoas=[Pessoa(descricao="P" * 500) for _ in range(20)],
                # elementos_cenario caps the list length but not each entry
                elementos_cenario=["E" * 1000 for _ in range(50)],
                audio=AudioInfo(transcricao="A" * 5000),
            ),
        )

    def test_worst_case_payload_stays_within_budget(self):
        text = generate_searchable_text(self._maxed_out_dto())

        assert len(text) <= MAX_EMBEDDING_CHARS

    def test_every_section_survives_truncation(self):
        """Truncation must shrink sections, never drop them: losing the title
        or description entirely would gut the retrieval signal."""
        text = generate_searchable_text(self._maxed_out_dto())

        assert "Title:" in text
        assert "Description:" in text
        assert "People:" in text
        assert "Elements:" in text
        assert "Audio:" in text

    def test_long_transcript_does_not_starve_description(self):
        dto = VideoMetadataDTO(
            titulo_sugerido="Entrevista longa",
            descricao_completa="Uma descrição relevante que precisa sobreviver. " * 10,
            metadados_estruturados=MetadadosEstruturados(
                audio=AudioInfo(transcricao="bla " * 1200),
            ),
        )

        text = generate_searchable_text(dto)

        assert len(text) <= MAX_EMBEDDING_CHARS
        assert "Uma descrição relevante que precisa sobreviver." in text

    def test_short_content_is_left_untouched(self):
        dto = VideoMetadataDTO(
            titulo_sugerido="Gato laranja comendo ração",
            descricao_completa="Gato de pelo curto comendo em cozinha.",
            metadados_estruturados=MetadadosEstruturados(
                audio=AudioInfo(transcricao="Olha ele comendo!"),
            ),
        )

        text = generate_searchable_text(dto)

        assert "Description: Gato de pelo curto comendo em cozinha." in text
        assert "Audio: Olha ele comendo!" in text
