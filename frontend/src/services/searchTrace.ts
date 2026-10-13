import { useSyncExternalStore } from 'react';
import { createStore } from '../utils/store';
import type { SearchMode } from '../constants/searchModes';

/** How long a search took, step by step. */
export interface SearchTrace {
  query: string;
  mode: SearchMode;
  found: number;
  /** From asking to having the answer, as this browser saw it. */
  roundTripMs: number;
  /** The server's own account. Null for a step it skipped or did not report. */
  embedMs: number | null;
  dbMs: number | null;
  serverMs: number | null;
}

export const lastSearch = createStore<SearchTrace | null>(null);

export const useLastSearch = () => useSyncExternalStore(lastSearch.subscribe, lastSearch.get);

/** One step out of a Server-Timing header. Whatever stands between here and the server may add its own. */
export const timed = (header: unknown, step: string): number | null => {
  if (typeof header !== 'string') return null;
  const found = new RegExp(`(?:^|,)\\s*${step};dur=([\\d.]+)`).exec(header);
  return found ? Number(found[1]) : null;
};
