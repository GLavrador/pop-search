"""Tests for new metadata structure validation."""
import pytest
from dtos import (
    Pessoa, 
    AudioInfo, 
    MetadadosEstruturados, 
    VideoMetadataDTO
)
from services.embedding import generate_searchable_text


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
        assert meta.tags_busca == []
    
    def test_video_metadata_dto_complete(self):
        """Test complete VideoMetadataDTO structure."""
        dto = VideoMetadataDTO(
            titulo_sugerido="Gato laranja comendo ração em tigela azul",
            descricao_completa="Gato laranja de pelo curto sentado em mesa de cozinha.",
            url_original="http://twitter.com/teste",
            metadados_estruturados=MetadadosEstruturados(
                pessoas=[],
                elementos_cenario=["mesa de cozinha", "tigela azul"],
                audio=AudioInfo(transcricao=""),
                tags_busca=["gato laranja", "ração", "cozinha"]
            )
        )
        assert dto.titulo_sugerido == "Gato laranja comendo ração em tigela azul"
        assert len(dto.metadados_estruturados.elementos_cenario) == 2
        assert len(dto.metadados_estruturados.tags_busca) == 3


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
                audio=AudioInfo(transcricao="Olha ele comendo!"),
                tags_busca=["gato", "ração", "cozinha"]
            )
        )
        
        text = generate_searchable_text(dto)
        
        assert "Title: Gato laranja comendo ração" in text
        assert "Description: Gato de pelo curto comendo em cozinha." in text
        assert "People: Mulher filmando" in text
        assert "Elements: mesa, tigela" in text
        assert "Audio: Olha ele comendo!" in text
        assert "Keywords: gato, ração, cozinha" in text
    
    def test_generate_with_minimal_metadata(self):
        """Test text generation with only required fields."""
        dto = VideoMetadataDTO(
            titulo_sugerido="Vídeo simples",
            descricao_completa="Um vídeo qualquer.",
            metadados_estruturados=MetadadosEstruturados()
        )
        
        text = generate_searchable_text(dto)
        
        assert "Title: Vídeo simples" in text
        assert "Description: Um vídeo qualquer." in text
        # Empty fields should not appear
        assert "People:" not in text
        assert "Elements:" not in text
