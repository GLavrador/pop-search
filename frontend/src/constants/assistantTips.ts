import { findSearchMode, type SearchMode } from './searchModes';
import type { SearchResult } from '../types';

export type TipId =
  | 'welcome'
  | 'operatorsIgnored'
  | 'thresholdTooHigh'
  | 'textTooRestrictive'
  | 'nothingFound'
  | 'onlyText'
  | 'onlySemantic';

export interface AssistantContext {
  query: string;
  mode: SearchMode;
  threshold: number;
  hasSearched: boolean;
  isLoading: boolean;
  results: SearchResult[];
}

export const HIGH_THRESHOLD = 0.7;
export const RESTRICTIVE_WORDS = 3;

// A quoted phrase, a token starting with "-", or a bare "or". Anchoring the
// minus to a token boundary keeps hyphenated words like "bem-vindo" out.
const OPERATOR_PATTERN = /"[^"]*"|(^|\s)-\S|(^|\s)or(\s|$)/i;

export const hasOperators = (query: string): boolean => OPERATOR_PATTERN.test(query);

export const wordCount = (query: string): number =>
  query.trim().split(/\s+/).filter(Boolean).length;

export const pickTip = (context: AssistantContext): TipId | null => {
  const { query, mode, threshold, hasSearched, isLoading, results } = context;

  if (isLoading) return null;

  // Worth saying before the search is spent, not after it comes back wrong.
  if (mode === 'semantic' && hasOperators(query)) return 'operatorsIgnored';

  if (!hasSearched) return query.trim() ? null : 'welcome';

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

  return null;
};
