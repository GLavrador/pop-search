import { useCallback } from 'react';
import type { GuideStep, Spot } from '../../constants/guide';
import type { Side } from '../Assistant/flight';
import styles from './styles.module.css';

export interface Aim {
  /** The control inside the spotlight that the step is really about. */
  pick?: string;
  /** Where the robot would rather stand, when the usual place would cover something. */
  from?: Side;
}

export const AIMS: Record<NonNullable<Spot>, Aim> = {
  balloon: {},
  url: { pick: '[data-aim]' },
  manual: { from: 'right' },
  options: { pick: '[data-aim]' },
  progress: {},
  review: { pick: 'input' },
  save: { pick: 'button[type="submit"]' },
  saved: {},
  query: { pick: '[data-aim]' },
  presets: {},
  results: { pick: 'span[title]' },
  advanced: { pick: 'button[aria-expanded]' },
};

const NOTHING: readonly Spot[] = [];

/**
 * Sorts the parts of a demo screen into three: the one the step is about, the
 * ones that stay usable beside it, and the rest, which goes quiet and inert.
 */
export const useSpotlight = (
  { spot, also = NOTHING, act }: Pick<GuideStep, 'spot' | 'also' | 'act'>,
  onSpot?: (node: HTMLElement | null) => void,
) => {
  const pick = spot ? AIMS[spot].pick : undefined;

  const reveal = useCallback(
    (node: HTMLElement | null) => {
      ((pick && node?.querySelector(pick)) || node)?.scrollIntoView({ block: 'nearest' });
      onSpot?.(node);
    },
    [onSpot, pick],
  );

  return (part: Spot | readonly Spot[], ...classes: string[]) => {
    const ids = typeof part === 'string' || part === null ? [part] : part;
    const marked = spot !== null && ids.includes(spot);
    const quiet = spot !== null && !marked && !ids.some((id) => also.includes(id));
    const state = marked ? [styles.spot, act ? styles.act : ''] : quiet ? [styles.dim] : [];

    return {
      className: [...classes, ...state].filter(Boolean).join(' '),
      ref: marked ? reveal : undefined,
      inert: quiet || undefined,
    };
  };
};
