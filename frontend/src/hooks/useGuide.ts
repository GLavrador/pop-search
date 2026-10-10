import { useCallback, useState } from 'react';
import { GUIDE_STEPS, type GuideStepDef } from '../constants/guide';
import type { Tab } from '../constants/tabs';

const LAST_INDEX = GUIDE_STEPS.length - 1;

interface UseGuideOptions {
  onEnterTab: (tab: Tab) => void;
}

export interface Guide {
  step: GuideStepDef | null;
  index: number;
  total: number;
  isVisible: boolean;
  isPaused: boolean;
  isFirst: boolean;
  isLast: boolean;
  start: () => void;
  hide: () => void;
  quit: () => void;
  goTo: (index: number) => void;
  next: () => void;
  back: () => void;
}

export const useGuide = ({ onEnterTab }: UseGuideOptions): Guide => {
  const [index, setIndex] = useState<number | null>(null);
  const [isHidden, setIsHidden] = useState(false);

  // Entering a step always applies that step in full, so arriving from the
  // step before, from the step after or from a jump lands on the same screen.
  const goTo = useCallback(
    (target: number) => {
      const next = Math.min(Math.max(target, 0), LAST_INDEX);
      setIndex(next);
      setIsHidden(false);
      onEnterTab(GUIDE_STEPS[next].tab);
    },
    [onEnterTab],
  );

  const quit = useCallback(() => {
    setIndex(null);
    setIsHidden(false);
  }, []);

  return {
    step: index === null ? null : GUIDE_STEPS[index],
    index: index ?? 0,
    total: GUIDE_STEPS.length,
    isVisible: index !== null && !isHidden,
    isPaused: index !== null && isHidden,
    isFirst: index === 0,
    isLast: index === LAST_INDEX,
    start: useCallback(() => goTo(0), [goTo]),
    hide: useCallback(() => setIsHidden(true), []),
    quit,
    goTo,
    next: useCallback(() => goTo((index ?? 0) + 1), [goTo, index]),
    back: useCallback(() => goTo((index ?? 0) - 1), [goTo, index]),
  };
};
