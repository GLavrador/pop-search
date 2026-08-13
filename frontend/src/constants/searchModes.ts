export type SearchMode = 'hybrid' | 'semantic' | 'text';

export interface SearchModeOption {
  id: SearchMode;
  usesThreshold: boolean;
  supportsOperators: boolean;
}

export const SEARCH_MODES: readonly SearchModeOption[] = [
  {
    id: 'hybrid',
    usesThreshold: true,
    supportsOperators: true,
  },
  {
    id: 'semantic',
    usesThreshold: true,
    supportsOperators: false,
  },
  {
    id: 'text',
    usesThreshold: false,
    supportsOperators: true,
  },
] as const;

export const DEFAULT_SEARCH_MODE: SearchMode = 'hybrid';

export const findSearchMode = (mode: SearchMode): SearchModeOption =>
  SEARCH_MODES.find((option) => option.id === mode) ?? SEARCH_MODES[0];
