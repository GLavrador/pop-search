import { useLayoutEffect } from 'react';
import { createStore } from '../../utils/store';

/** The colours of the phone's own bars around the page: the status bar on top, the browser's bar below. */
export interface Bars {
  top: string;
  bottom: string;
}

export const BARS = {
  desktop: { top: '#008080', bottom: '#c0c0c0' },
  blue: { top: '#0000aa', bottom: '#0000aa' },
  boot: { top: '#000000', bottom: '#000000' },
  bin: { top: '#000080', bottom: '#c0c0c0' },
  window: { top: '#000080', bottom: '#c0c0c0' },
} as const satisfies Record<string, Bars>;

interface Claim {
  bars: Bars;
}

// Every screen that has the bars for now, the last one in on top. Each change has a turn of its own.
export const claims = createStore<{ list: readonly Claim[]; turn: number }>({ list: [], turn: 0 });

const change = (list: readonly Claim[]) => claims.set({ list, turn: claims.get().turn + 1 });

/** While it is on screen, a screen has the bars in its colours. Null has them as they were. */
export const useBarColors = (bars: Bars | null) => {
  const top = bars?.top;
  const bottom = bars?.bottom;

  useLayoutEffect(() => {
    if (!top || !bottom) return;
    const claim = { bars: { top, bottom } };
    change([...claims.get().list, claim]);
    return () => change(claims.get().list.filter((other) => other !== claim));
  }, [top, bottom]);
};
