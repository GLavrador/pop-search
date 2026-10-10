import { useCallback } from 'react';
import type { Spot } from '../../constants/guide';
import type { Side } from '../Assistant/flight';
import styles from './styles.module.css';

export interface Aim {
  /** The control inside the spotlight that the step is really about. */
  pick?: string;
  /** Where the robot would rather stand, when the usual place would cover something. */
  from?: Side;
}

export const AIMS: Record<NonNullable<Spot>, Aim> = {
  url: { pick: '[data-aim]' },
  manual: { from: 'right' },
  options: { pick: '[data-aim]' },
  progress: {},
  review: { pick: 'input' },
  saved: {},
  query: { pick: '[data-aim]' },
  results: { pick: 'span[title]' },
  advanced: { pick: 'button[aria-expanded]' },
};

/** Marks the element a step is about, brings it into view, and reports it upward. */
export const useSpotlight = (spot: Spot, onSpot?: (node: HTMLElement | null) => void) => {
  const reveal = useCallback(
    (node: HTMLElement | null) => {
      node?.scrollIntoView({ block: 'nearest' });
      onSpot?.(node);
    },
    [onSpot],
  );

  return (target: Spot, ...classes: string[]) => {
    const marked = target === spot;
    return {
      className: marked ? [...classes, styles.spot].join(' ') : classes.join(' '),
      ref: marked ? reveal : undefined,
    };
  };
};
