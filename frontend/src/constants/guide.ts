import type { ReactNode } from 'react';
import type { Tab } from './tabs';

export type IngestStage = 'url' | 'options' | 'analyzing' | 'review' | 'saved';
export type SearchStage = 'idle' | 'results';

export type Spot =
  | 'url'
  | 'manual'
  | 'options'
  | 'progress'
  | 'review'
  | 'saved'
  | 'query'
  | 'results'
  | 'advanced'
  | null;

export interface GuideStep {
  readonly id: string;
  readonly tab: Tab;
  readonly ingest: IngestStage;
  readonly search: SearchStage;
  readonly spot: Spot;
}

// Each step is a full snapshot of the screen, never a delta, so entering one
// from anywhere lands on the same state.
export const GUIDE_STEPS = [
  { id: 'welcome', tab: 'ingest', ingest: 'url', search: 'idle', spot: null },
  { id: 'paste', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'url' },
  { id: 'options', tab: 'ingest', ingest: 'options', search: 'idle', spot: 'options' },
  { id: 'analyzing', tab: 'ingest', ingest: 'analyzing', search: 'idle', spot: 'progress' },
  { id: 'review', tab: 'ingest', ingest: 'review', search: 'idle', spot: 'review' },
  { id: 'saved', tab: 'ingest', ingest: 'saved', search: 'idle', spot: 'saved' },
  { id: 'manual', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'manual' },
  { id: 'searchIntro', tab: 'search', ingest: 'url', search: 'idle', spot: 'query' },
  { id: 'results', tab: 'search', ingest: 'url', search: 'results', spot: 'results' },
  { id: 'modes', tab: 'search', ingest: 'url', search: 'results', spot: 'advanced' },
  { id: 'account', tab: 'account', ingest: 'url', search: 'idle', spot: null },
] as const satisfies readonly GuideStep[];

export type GuideStepDef = (typeof GUIDE_STEPS)[number];

export type GuideStepId = GuideStepDef['id'];

export interface GuideStepCopy {
  title: string;
  say: ReactNode;
}
