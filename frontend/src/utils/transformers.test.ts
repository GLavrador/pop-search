import { describe, it, expect } from 'vitest';
import { transformFormDataToMetadata } from './transformers';
import type { VideoMetadata } from '../types';

const baseMock: VideoMetadata = {
  titulo_sugerido: '',
  descricao_completa: '',
  url_original: '',
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: [],
    audio: { transcricao: '', musica: null, artista: null },
    tags_busca: []
  }
};

describe('transformFormDataToMetadata', () => {
  it('should split comma-separated tags_busca string into array', () => {
    const input = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: ' react,  testing ' as unknown as string[]
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual(['react', 'testing']);
  });

  it('should split comma-separated elementos_cenario string into array', () => {
    const input = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        elementos_cenario: 'mesa, cadeira, janela' as unknown as string[]
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.elementos_cenario).toEqual(['mesa', 'cadeira', 'janela']);
  });

  it('should handle already existing arrays (no change)', () => {
    const input = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: ['tag1', 'tag2']
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual(['tag1', 'tag2']);
  });

  it('should remove empty strings caused by trailing commas', () => {
    const input = {
      ...baseMock,
      metadados_estruturados: {
        ...baseMock.metadados_estruturados,
        tags_busca: 'tag1, tag2,, ' as unknown as string[]
      }
    };

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_estruturados.tags_busca).toEqual(['tag1', 'tag2']);
  });
});