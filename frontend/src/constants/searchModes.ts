export type SearchMode = 'hybrid' | 'semantic' | 'text';

export interface SearchModeOption {
  id: SearchMode;
  label: string;
  hint: string;
  usesThreshold: boolean;
  supportsOperators: boolean;
  operatorScope: string;
}

export const SEARCH_MODES: readonly SearchModeOption[] = [
  {
    id: 'hybrid',
    label: 'Hybrid',
    hint: 'Meaning and exact terms combined. A video is found either by what it shows or by the words it contains.',
    usesThreshold: true,
    supportsOperators: true,
    operatorScope:
      'These steer the exact-terms half of the search. The meaning half always reads your full text.',
  },
  {
    id: 'semantic',
    label: 'Semantic',
    hint: 'Meaning only. Finds related videos even when none of your words appear in them.',
    usesThreshold: true,
    supportsOperators: false,
    operatorScope:
      'Not available here. Quotes and minus signs are read as ordinary characters and change how your text is interpreted.',
  },
  {
    id: 'text',
    label: 'Exact',
    hint: 'Literal terms only. A video must contain every word you typed, in any order.',
    usesThreshold: false,
    supportsOperators: true,
    operatorScope: 'These control the entire search.',
  },
] as const;

export const DEFAULT_SEARCH_MODE: SearchMode = 'hybrid';

export const findSearchMode = (mode: SearchMode): SearchModeOption =>
  SEARCH_MODES.find((option) => option.id === mode) ?? SEARCH_MODES[0];
