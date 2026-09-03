import { useMemo, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/languageContext';
import { buildTourFrames } from '../constants/tourScript';
import { useDemoMode } from '../hooks/useDemoMode';
import { TourContext } from './tourContext';

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useI18n();
  const demo = useDemoMode();
  const [active, setActive] = useState(false);
  const [cursor, setCursor] = useState(0);

  const frames = useMemo(() => buildTourFrames(t.tour.script), [t.tour.script]);

  const value = useMemo(() => {
    const total = frames.length;

    return {
      active,
      cursor,
      total,
      frame: active ? frames[Math.min(cursor, total - 1)] ?? null : null,
      isLast: cursor >= total - 1,
      // The tutorial and the examples are one switch. Leaving demo answers on
      // after the tour ends would quietly show a visitor an archive that is not
      // there.
      start: () => {
        setCursor(0);
        setActive(true);
        demo.start();
      },
      stop: () => {
        setActive(false);
        demo.stop();
      },
      next: () => setCursor((at) => Math.min(at + 1, total - 1)),
      back: () => setCursor((at) => Math.max(at - 1, 0)),
    };
  }, [active, cursor, frames, demo]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
