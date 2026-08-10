export type SearchMode = 'hybrid' | 'semantic' | 'text';

export interface SearchModeOption {
  id: SearchMode;
  label: string;
  hint: string;
  usesThreshold: boolean;
}

export const SEARCH_MODES: readonly SearchModeOption[] = [
  {
    id: 'hybrid',
    label: 'Hybrid',
    hint: 'Meaning and exact terms combined. A video is found either by what it shows or by the words it contains.',
    usesThreshold: true,
  },
  {
    id: 'semantic',
    label: 'Semantic',
    hint: 'Meaning only. Finds related videos even when none of your words appear in them.',
    usesThreshold: true,
  },
  {
    id: 'text',
    label: 'Exact',
    hint: 'Literal terms only. A video must contain every word you typed, in any order.',
    usesThreshold: false,
  },
] as const;

export const DEFAULT_SEARCH_MODE: SearchMode = 'hybrid';

export const findSearchMode = (mode: SearchMode): SearchModeOption =>
  SEARCH_MODES.find((option) => option.id === mode) ?? SEARCH_MODES[0];
