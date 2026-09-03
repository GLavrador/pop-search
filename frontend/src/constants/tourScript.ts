export const TOUR_STEP_IDS = [
  'welcome',
  'search',
  'results',
  'precision',
  'ingest',
  'analysis',
  'review',
  'library',
  'account',
] as const;

export type TourStepId = (typeof TOUR_STEP_IDS)[number];

/** The tabs the tour drives. Stats is deliberately absent: it is admin only. */
export type TourTab = 'search' | 'ingest' | 'library' | 'account';

export const TOUR_TAB: Record<TourStepId, TourTab> = {
  welcome: 'search',
  search: 'search',
  results: 'search',
  precision: 'search',
  ingest: 'ingest',
  analysis: 'ingest',
  review: 'ingest',
  library: 'library',
  account: 'account',
};

export interface TourFrame {
  id: TourStepId;
  tab: TourTab;
  text: string;
  /** 1-based position of the owning step, for the progress label. */
  step: number;
  totalSteps: number;
}

/**
 * Flattens the script into one list of frames, so a single Next walks the cards
 * of a step and then rolls into the next step. Two separate controls for
 * "next card" and "next step" is one control too many for a tutorial.
 */
export const buildTourFrames = (script: Record<TourStepId, readonly string[]>): TourFrame[] =>
  TOUR_STEP_IDS.flatMap((id, index) =>
    script[id].map((text) => ({
      id,
      tab: TOUR_TAB[id],
      text,
      step: index + 1,
      totalSteps: TOUR_STEP_IDS.length,
    }))
  );
