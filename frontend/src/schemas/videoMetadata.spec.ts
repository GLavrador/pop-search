import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { createVideoMetadataFormSchema, createVideoUrlInputSchema } from './videoMetadata';

const schema = createVideoMetadataFormSchema(en.validation);
const valid = {
  titulo_sugerido: 'Video',
  descricao_completa: 'D'.repeat(20),
  url_original: 'https://example.com/video',
  metadados_estruturados: {
    pessoas: [], elementos_cenario: '',
    audio: { transcricao: '', musica: null, artista: null },
  },
};

describe('metadata validation', () => {
  it('counts characters and trims title and description', () => {
    const result = schema.parse({ ...valid, titulo_sugerido: '  Video  ', descricao_completa: `  ${valid.descricao_completa}  ` });
    expect(result.titulo_sugerido).toBe('Video');
    expect(result.descricao_completa).toBe(valid.descricao_completa);
    expect(schema.safeParse({ ...valid, titulo_sugerido: '😀'.repeat(5) }).success).toBe(true);
    expect(schema.safeParse({ ...valid, titulo_sugerido: '😀'.repeat(201) }).success).toBe(false);
  });

  it.each([
    ['titulo_sugerido', '    '], ['titulo_sugerido', 'abcd'], ['titulo_sugerido', 'x'.repeat(201)],
    ['descricao_completa', ' '.repeat(20)], ['descricao_completa', 'x'.repeat(19)],
    ['descricao_completa', 'x'.repeat(5001)],
  ])('rejects invalid %s', (field, value) => {
    expect(schema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it.each(['not-a-url', 'x.com/video', 'ftp://example.com/video', 'javascript:alert(1)', 'https://'])('rejects URL %s', (url) => {
    expect(createVideoUrlInputSchema(en.validation).safeParse(url).success).toBe(false);
    expect(schema.safeParse({ ...valid, url_original: url }).success).toBe(false);
  });

  it('accepts text at the maximum lengths', () => {
    expect(schema.safeParse({ ...valid, titulo_sugerido: 'x'.repeat(200), descricao_completa: 'x'.repeat(5000) }).success).toBe(true);
  });

  it.each([
    { elementos_cenario: 'x'.repeat(501) },
    { elementos_cenario: Array(51).fill('tree').join(',') },
    { pessoas: Array(21).fill({ descricao: 'Person', papel: null }) },
    { pessoas: [{ descricao: 'x'.repeat(501), papel: null }] },
    { pessoas: [{ descricao: 'ab', papel: null }] },
    { pessoas: [{ descricao: 'Person', papel: 'x'.repeat(101) }] },
    { audio: { ...valid.metadados_estruturados.audio, transcricao: 'x'.repeat(5001) } },
    { audio: { ...valid.metadados_estruturados.audio, musica: 'x'.repeat(201) } },
    { audio: { ...valid.metadados_estruturados.audio, artista: 'x'.repeat(201) } },
  ])('rejects metadata outside backend limits', (changes) => {
    expect(schema.safeParse({ ...valid, metadados_estruturados: { ...valid.metadados_estruturados, ...changes } }).success).toBe(false);
  });

  it('accepts the maximum number and size of scenario items', () => {
    expect(schema.safeParse({ ...valid, metadados_estruturados: {
      ...valid.metadados_estruturados, elementos_cenario: Array(50).fill('x'.repeat(500)).join(', '),
    } }).success).toBe(true);
  });
});
