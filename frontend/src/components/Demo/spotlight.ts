import { useCallback } from 'react';
import type { Spot } from '../../constants/guide';
import styles from './styles.module.css';

/** Marks the element a step is about, and brings it into view when the step lands on it. */
export const useSpotlight = (spot: Spot) => {
  const reveal = useCallback((node: HTMLElement | null) => {
    node?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (target: Spot, ...classes: string[]) => {
    const marked = target === spot;
    return {
      className: marked ? [...classes, styles.spot].join(' ') : classes.join(' '),
      ref: marked ? reveal : undefined,
    };
  };
};
