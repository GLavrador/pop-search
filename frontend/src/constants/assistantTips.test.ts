import { describe, it, expect } from 'vitest';
import { pickTip, hasOperators, wordCount, countOrigins, type AssistantContext } from './assistantTips';
import type { SearchResult } from '../types';

const result = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  id: 'x',
  titulo_video: 'Vídeo',
  url_original: 'http://x.com/x',
  similarity: 0.8,
  text_rank: 0.5,
  score: 0.03,
  ...overrides,
});

const context = (overrides: Partial<AssistantContext> = {}): AssistantContext => ({
  query: 'banda',
  mode: 'hybrid',
  threshold: 0.6,
  hasSearched: true,
  isLoading: false,
  results: [result()],
  ...overrides,
});

describe('hasOperators', () => {
  it.each([
    ['"frase exata"', true],
    ['baleia -orca', true],
    ['baleia or golfinho', true],
    ['BALEIA OR GOLFINHO', true],
    ['gato laranja', false],
    ['bem-vindo ao acervo', false],
    ['cachorro-quente', false],
  ])('should read %s as operators: %s', (query, expected) => {
    expect(hasOperators(query)).toBe(expected);
  });
});

describe('wordCount', () => {
  it('should ignore padding around and between words', () => {
    expect(wordCount('  gato   laranja  ')).toBe(2);
    expect(wordCount('   ')).toBe(0);
  });
});

describe('pickTip', () => {
  it('should greet only before anything is typed', () => {
    expect(pickTip(context({ hasSearched: false, query: '' }))).toBe('welcome');
    expect(pickTip(context({ hasSearched: false, query: 'gato' }))).toBe('typing');
  });

  it('should narrate the wait instead of vanishing mid search', () => {
    expect(pickTip(context({ isLoading: true, results: [] }))).toBe('searching');
  });

  it('should warn about operators before the search is spent', () => {
    const tip = pickTip(context({ mode: 'semantic', query: '"gato laranja"', hasSearched: false }));

    expect(tip).toBe('operatorsIgnored');
  });

  it('should not warn about operators where they actually work', () => {
    expect(pickTip(context({ mode: 'text', query: '"gato laranja"', results: [result()] }))).toBe('goodResults');
    expect(pickTip(context({ mode: 'hybrid', query: 'gato -preto' }))).toBe('goodResults');
  });

  it('should blame the threshold when it is high and nothing came back', () => {
    const tip = pickTip(context({ results: [], threshold: 0.85 }));

    expect(tip).toBe('thresholdTooHigh');
  });

  it('should not blame the threshold in a mode that ignores it', () => {
    const tip = pickTip(context({ mode: 'text', results: [], threshold: 0.85, query: 'a b c' }));

    expect(tip).toBe('textTooRestrictive');
  });

  it('should explain the implicit AND when many words found nothing', () => {
    const tip = pickTip(context({ results: [], threshold: 0.5, query: 'gato laranja dormindo' }));

    expect(tip).toBe('textTooRestrictive');
  });

  it('should fall back to a plain empty message', () => {
    const tip = pickTip(context({ results: [], threshold: 0.5, query: 'gato' }));

    expect(tip).toBe('nothingFound');
  });

  it('should point out a result set that matched words alone', () => {
    const tip = pickTip(context({ results: [result({ similarity: 0 }), result({ similarity: 0 })] }));

    expect(tip).toBe('onlyText');
  });

  it('should point out a result set that matched meaning alone', () => {
    const tip = pickTip(context({ results: [result({ text_rank: 0 }), result({ text_rank: 0 })] }));

    expect(tip).toBe('onlySemantic');
  });

  it('should not claim meaning alone outside hybrid, where the other branch never ran', () => {
    const tip = pickTip(context({ mode: 'semantic', results: [result({ text_rank: 0 })] }));

    expect(tip).toBe('goodResults');
  });

  it('should report the mix rather than disappear when the search went well', () => {
    expect(pickTip(context())).toBe('goodResults');
  });

  it('should never leave the character with nothing to say', () => {
    const shapes: Partial<AssistantContext>[] = [
      { hasSearched: false, query: '' },
      { hasSearched: false, query: 'gato' },
      { isLoading: true },
      { results: [] },
      { results: [], threshold: 0.9 },
      { results: [result()] },
      { results: [result({ similarity: 0 })] },
      { results: [result({ text_rank: 0 })] },
      { mode: 'semantic', query: '"x"' },
    ];

    shapes.forEach((shape) => expect(pickTip(context(shape))).toBeTruthy());
  });
});

describe('countOrigins', () => {
  it('should split a result set by where each row came from', () => {
    const counts = countOrigins([
      result({ similarity: 0.8, text_rank: 0.5 }),
      result({ similarity: 0.8, text_rank: 0 }),
      result({ similarity: 0, text_rank: 0.5 }),
      result({ similarity: 0, text_rank: 0.2 }),
    ]);

    expect(counts).toEqual({ both: 1, meaning: 1, words: 2 });
  });

  it('should count an empty result set as nothing at all', () => {
    expect(countOrigins([])).toEqual({ both: 0, meaning: 0, words: 0 });
  });
});
