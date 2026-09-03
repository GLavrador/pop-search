import {
  DEMO_SEARCH_RESULTS,
  DEMO_VIDEO,
  demoMyVideos,
  demoQuotaStatus,
} from '../constants/demoVideo';
import { DEFAULT_THRESHOLD } from '../constants/searchPresets';
import { DEFAULT_SEARCH_MODE } from '../constants/searchModes';
import type { MyVideo, QuotaStatus, SearchParams, SearchResult, VideoMetadata } from '../types';

let active = false;
const listeners = new Set<(value: boolean) => void>();

export const isDemoActive = (): boolean => active;

export const setDemoActive = (value: boolean): void => {
  active = value;
  listeners.forEach((listener) => listener(value));
};

export const subscribeToDemo = (listener: (value: boolean) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const SEARCH_MS = 500;
const ANALYSIS_MS = 2400;
const SAVE_MS = 500;
const READ_MS = 150;

// The delays are the point, not padding. Without them the progress bar and the
// assistant's "searching" card never appear, and the tour would teach a flow
// nobody will recognise once the real one runs.
const after = <T>(value: T, ms: number): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Mirrors match_videos: the threshold gates the vector branch alone, a text
 * match comes through at any threshold, and each single mode drops the branch
 * it does not use.
 */
export const demoSearch = ({
  threshold = DEFAULT_THRESHOLD,
  mode = DEFAULT_SEARCH_MODE,
}: SearchParams): Promise<SearchResult[]> => {
  const rows = DEMO_SEARCH_RESULTS.filter((row) => {
    const byMeaning = mode !== 'text' && row.similarity >= threshold;
    const byWords = mode !== 'semantic' && (row.text_rank ?? 0) > 0;
    return byMeaning || byWords;
  });

  return after(rows, SEARCH_MS);
};

export const demoAnalyse = (): Promise<VideoMetadata> => after(DEMO_VIDEO, ANALYSIS_MS);

export const demoSave = (): Promise<void> => after(undefined, SAVE_MS);

export const demoQuota = (): Promise<QuotaStatus> => after(demoQuotaStatus(), READ_MS);

export const demoVideos = (): Promise<MyVideo[]> => after(demoMyVideos(), READ_MS);
