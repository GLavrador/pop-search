import { findSearchMode, type SearchMode } from './searchModes';
import type { SearchResult } from '../types';

export type TipId =
  | 'welcome'
  | 'typing'
  | 'searching'
  | 'operatorsIgnored'
  | 'thresholdTooHigh'
  | 'textTooRestrictive'
  | 'nothingFound'
  | 'onlyText'
  | 'onlySemantic'
  | 'goodResults';

export interface AssistantContext {
  query: string;
  mode: SearchMode;
  threshold: number;
  hasSearched: boolean;
  isLoading: boolean;
  results: SearchResult[];
}

export interface OriginCounts {
  both: number;
  meaning: number;
  words: number;
}

export const HIGH_THRESHOLD = 0.7;
export const RESTRICTIVE_WORDS = 3;

// A quoted phrase, a token starting with "-", or a bare "or". Anchoring the
// minus to a token boundary keeps hyphenated words like "bem-vindo" out.
const OPERATOR_PATTERN = /"[^"]*"|(^|\s)-\S|(^|\s)or(\s|$)/i;

export const hasOperators = (query: string): boolean => OPERATOR_PATTERN.test(query);

export const wordCount = (query: string): number =>
  query.trim().split(/\s+/).filter(Boolean).length;

export const countOrigins = (results: SearchResult[]): OriginCounts =>
  results.reduce<OriginCounts>(
    (counts, result) => {
      const meaning = (result.similarity ?? 0) > 0;
      const words = (result.text_rank ?? 0) > 0;

      if (meaning && words) counts.both += 1;
      else if (meaning) counts.meaning += 1;
      else counts.words += 1;

      return counts;
    },
    { both: 0, meaning: 0, words: 0 }
  );

// Always returns a tip. Vanishing mid task reads as a broken widget, so the
// character stays put and changes what it says instead.
export const pickTip = (context: AssistantContext): TipId => {
  const { query, mode, threshold, hasSearched, isLoading, results } = context;

  if (isLoading) return 'searching';

  // Worth saying before the search is spent, not after it comes back wrong.
  if (mode === 'semantic' && hasOperators(query)) return 'operatorsIgnored';

  if (!hasSearched) return query.trim() ? 'typing' : 'welcome';

  if (results.length === 0) {
    if (findSearchMode(mode).usesThreshold && threshold >= HIGH_THRESHOLD) {
      return 'thresholdTooHigh';
    }
    if (mode !== 'semantic' && wordCount(query) >= RESTRICTIVE_WORDS) {
      return 'textTooRestrictive';
    }
    return 'nothingFound';
  }

  if (results.every((result) => (result.similarity ?? 0) === 0)) return 'onlyText';
  if (mode === 'hybrid' && results.every((result) => (result.text_rank ?? 0) === 0)) {
    return 'onlySemantic';
  }

  return 'goodResults';
};
