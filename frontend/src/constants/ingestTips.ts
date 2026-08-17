export type IngestTipId =
  | 'start'
  | 'badLink'
  | 'ready'
  | 'manual'
  | 'analysing'
  | 'failed'
  | 'review';

export interface IngestContext {
  url: string;
  manualMode: boolean;
  isAnalyzing: boolean;
  hasError: boolean;
  reviewing: boolean;
}

// Mirrors ALLOWED_DOMAINS in the backend. Checking here too is what lets the
// assistant refuse a link before it costs the user a request.
export const ALLOWED_HOSTS = ['twitter.com', 'x.com'] as const;

export const TOTAL_STEPS = 3;

export const STEP_NUMBER: Partial<Record<IngestTipId, number>> = {
  start: 1,
  badLink: 1,
  ready: 2,
  manual: 2,
  analysing: 2,
  review: 3,
};

export const isSupportedLink = (url: string): boolean => {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

// Unlike the search assistant, this one always has something to say: it is a
// walkthrough, and silence in the middle of a flow reads as a dead end.
export const pickIngestTip = (context: IngestContext): IngestTipId => {
  const { url, manualMode, isAnalyzing, hasError, reviewing } = context;

  if (reviewing) return 'review';
  if (isAnalyzing) return 'analysing';
  if (hasError) return 'failed';
  if (manualMode) return 'manual';
  if (!url.trim()) return 'start';
  if (!isSupportedLink(url)) return 'badLink';

  return 'ready';
};
