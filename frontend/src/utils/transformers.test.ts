import { describe, it, expect } from 'vitest';
import { transformFormDataToMetadata } from './transformers';
import type { VideoMetadata } from '../types';

const baseMock: VideoMetadata = {
  titulo_sugerido: '',
  resumo: '',
  url_original: '',
  metadados_visuais: { pessoas: [], elementos_cenario: [], contexto: '' },
  metadados_audio: { transcricao_trecho: '', musica_identificada: null, artista: null },
  tags_busca: [],
  sentimento: 'neutral'
};

describe('transformFormDataToMetadata', () => {
  it('should split comma-separated strings into trimmed arrays', () => {
    const input = {
      ...baseMock,
      metadados_visuais: { ...baseMock.metadados_visuais, pessoas: 'Alice, Bob, Charlie ' },
      tags_busca: ' react,  testing '
    } as unknown as VideoMetadata;

    const result = transformFormDataToMetadata(input);

    expect(result.metadados_visuais.pessoas).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(result.tags_busca).toEqual(['react', 'testing']);
  });

  it('should remove empty strings caused by trailing commas', () => {
    const input = {
      ...baseMock,
      tags_busca: 'tag1, tag2,, '
    } as unknown as VideoMetadata;

    const result = transformFormDataToMetadata(input);

    expect(result.tags_busca).toEqual(['tag1', 'tag2']);
  });

  it('should handle already existing arrays (no change)', () => {
    const input = {
      ...baseMock,
      tags_busca: ['tag1', 'tag2']
    };

    const result = transformFormDataToMetadata(input);

    expect(result.tags_busca).toEqual(['tag1', 'tag2']);
  });
});