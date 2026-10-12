import type { AnalysisStage } from '../types';

export const ANALYSIS_POLL_MS = 2000;

/** How long the news may fail to arrive before the screen stops pretending to wait. */
export const ANALYSIS_LOST_AFTER_MS = 20000;

/** The steps worth showing, in the order they happen. */
export const ANALYSIS_STEPS = [
  'downloading',
  'uploading',
  'watching',
  'writing',
] as const satisfies readonly AnalysisStage[];

export type AnalysisStep = (typeof ANALYSIS_STEPS)[number];
