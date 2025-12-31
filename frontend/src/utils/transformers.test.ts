import { describe, it, expect } from 'vitest';
import { transformFormDataToMetadata } from './transformers';
import type { VideoMetadataForm } from '../schemas/videoMetadata';

const baseMock: VideoMetadataForm = {
  titulo_sugerido: 'Test title with five words here',
  descricao_completa: 'This is a test description that has more than twenty words so it passes the validation requirement for the form schema test',
  url_original: 'https://example.com',
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: '',
    audio: { transcricao: '', musica: null, artista: null },
    tags_busca: ''
  }
};

describe('transformFormDataToMetadata', () => {
  it('should split comma-separated tags_busca string into array', () => {
    const input: VideoMetadataForm = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: ' react,  testing '
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual(['react', 'testing']);
  });

  it('should split comma-separated elementos_cenario string into array', () => {
    const input: VideoMetadataForm = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        elementos_cenario: 'mesa, cadeira, janela'
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.elementos_cenario).toEqual(['mesa', 'cadeira', 'janela']);
  });

  it('should handle empty string (returns empty array)', () => {
    const input: VideoMetadataForm = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: ''
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual([]);
  });

  it('should remove empty strings caused by trailing commas', () => {
    const input: VideoMetadataForm = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: 'tag1, tag2,, '
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual(['tag1', 'tag2']);
  });
});