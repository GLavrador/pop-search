import { useCallback, useState } from 'react';

export type Game = 'flappy' | 'dino';
export type Records = Record<Game, number>;

// The best score of whoever uses this browser, at each game. It is kept between visits.
export const RECORDS_KEY = 'pop-search:bin-records';

const NONE: Records = { flappy: 0, dino: 0 };

const whole = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

// A browser may refuse storage, or hold something else under the name: either way there is no record.
export const readRecords = (): Records => {
  try {
    const kept: unknown = JSON.parse(localStorage.getItem(RECORDS_KEY) ?? 'null');
    if (typeof kept !== 'object' || kept === null) return NONE;
    const { flappy, dino } = kept as Partial<Record<Game, unknown>>;
    return { flappy: whole(flappy), dino: whole(dino) };
  } catch {
    return NONE;
  }
};

const keep = (records: Records) => {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Not kept this time. The score still counts for as long as the page is open.
  }
};

export const useRecords = () => {
  const [records, setRecords] = useState(readRecords);

  /** Takes a score in. True when it beat what was there. */
  const score = useCallback(
    (game: Game, points: number) => {
      if (points <= records[game]) return false;
      const next = { ...records, [game]: points };
      setRecords(next);
      keep(next);
      return true;
    },
    [records],
  );

  return { records, score };
};
