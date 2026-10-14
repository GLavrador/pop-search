import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/authContext';
import { getBinRecords, keepBinRecords } from '../../services/api';
import type { BinRecords } from '../../types';

export type Game = keyof BinRecords;
export type Records = BinRecords;

// The best score of whoever uses this browser without an account, at each game. It is kept between visits.
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

export const bestOf = (a: Records, b: Records): Records => ({
  flappy: Math.max(a.flappy, b.flappy),
  dino: Math.max(a.dino, b.dino),
});

const beats = (a: Records, b: Records) => a.flappy > b.flappy || a.dino > b.dino;

/**
 * The best score at each game. Signed in, it is kept in the account, and what
 * this browser had from before goes into the account the first time round:
 * the better of the two counts. Signed out, the browser keeps it. A record the
 * account could not take is kept in the browser, so it is not lost.
 */
export const useRecords = () => {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const queryClient = useQueryClient();
  const [local, setLocal] = useState(readRecords);

  const account = useQuery({
    queryKey: ['bin-records', userId],
    queryFn: async ({ signal }) => {
      const kept = await getBinRecords(signal);
      const here = readRecords();
      return beats(here, kept) ? keepBinRecords(bestOf(kept, here)) : kept;
    },
    enabled: userId !== null,
    staleTime: Infinity,
    retry: false,
  });

  const records = userId !== null && account.data ? bestOf(account.data, local) : local;

  /** Takes a score in. True when it beat what was there. */
  const score = useCallback(
    (game: Game, points: number) => {
      if (points <= records[game]) return false;
      const next = { ...records, [game]: points };
      const keepHere = () => {
        keep(next);
        setLocal(next);
      };

      if (userId === null) {
        keepHere();
        return true;
      }
      const key = ['bin-records', userId];
      queryClient.setQueryData<Records>(key, (now) => bestOf(now ?? NONE, next));
      keepBinRecords(next)
        .then((saved) => queryClient.setQueryData(key, saved))
        .catch(keepHere);
      return true;
    },
    [records, userId, queryClient],
  );

  return { records, score };
};
