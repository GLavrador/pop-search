import type { ReactNode } from 'react';
import type { Tab } from './tabs';

export type IngestStage = 'url' | 'options' | 'analyzing' | 'review' | 'saved';
export type SearchStage = 'idle' | 'results';

export type Spot =
  | 'balloon'
  | 'url'
  | 'manual'
  | 'options'
  | 'progress'
  | 'review'
  | 'save'
  | 'saved'
  | 'query'
  | 'presets'
  | 'results'
  | 'advanced'
  | null;

export interface GuideStep {
  readonly id: string;
  readonly tab: Tab;
  readonly ingest: IngestStage;
  readonly search: SearchStage;
  /** What the step is about. Everything else in the demo goes quiet and inert. */
  readonly spot: Spot;
  /** Parts that stay lit and usable besides the spot. */
  readonly also?: readonly Spot[];
  /**
   * True when the way forward is a control of the app itself. The assistant
   * then offers no button of its own, so there is never two ways to continue.
   */
  readonly act: boolean;
}

// Each step is a full snapshot of the screen, never a delta, so entering one
// from anywhere lands on the same state.
export const GUIDE_STEPS = [
  { id: 'welcome', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'balloon', act: false },
  { id: 'about', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'balloon', act: false },
  { id: 'paste', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'url', act: true },
  { id: 'options', tab: 'ingest', ingest: 'options', search: 'idle', spot: 'options', act: true },
  {
    id: 'analyzing',
    tab: 'ingest',
    ingest: 'analyzing',
    search: 'idle',
    spot: 'progress',
    act: false,
  },
  { id: 'review', tab: 'ingest', ingest: 'review', search: 'idle', spot: 'review', act: false },
  { id: 'save', tab: 'ingest', ingest: 'review', search: 'idle', spot: 'save', act: true },
  { id: 'saved', tab: 'ingest', ingest: 'saved', search: 'idle', spot: 'saved', act: false },
  { id: 'manual', tab: 'ingest', ingest: 'url', search: 'idle', spot: 'manual', act: false },
  { id: 'searchIntro', tab: 'search', ingest: 'url', search: 'idle', spot: 'query', act: true },
  { id: 'results', tab: 'search', ingest: 'url', search: 'results', spot: 'results', act: false },
  {
    id: 'modes',
    tab: 'search',
    ingest: 'url',
    search: 'results',
    spot: 'advanced',
    also: ['presets', 'results'],
    act: false,
  },
  { id: 'account', tab: 'account', ingest: 'url', search: 'idle', spot: null, act: false },
] as const satisfies readonly GuideStep[];

export type GuideStepDef = (typeof GUIDE_STEPS)[number];

export type GuideStepId = GuideStepDef['id'];

export interface GuideStepCopy {
  title: string;
  say: ReactNode;
  /** What to do in the app, on a step whose way forward is the app. */
  task?: ReactNode;
  /** Label of the assistant's own button, when "got it" does not fit. */
  next?: string;
}
