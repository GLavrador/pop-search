import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/authContext';
import { getBinRecords, keepBinRecords } from '../../services/api';
import type { BinRecords } from '../../types';

export type Game = keyof BinRecords;
export type Records = BinRecords;

// The best score of whoever uses this browser without an account, at each game. It is kept between visits.
export const RECORDS_KEY = 'pop-search:bin-records';
// The records of the account last signed in here, so that signing out does not take them down.
// They are only shown and played against: they never go into another account.
export const SEEN_KEY = 'pop-search:bin-records-seen';

const NONE: Records = { flappy: 0, dino: 0 };

const whole = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

// A browser may refuse storage, or hold something else under the name: either way there is nothing.
const stored = (key: string): Record<string, unknown> => {
  try {
    const kept: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return typeof kept === 'object' && kept !== null ? (kept as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const scores = ({ flappy, dino }: Record<string, unknown>): Records => ({
  flappy: whole(flappy),
  dino: whole(dino),
});

export const readRecords = (): Records => scores(stored(RECORDS_KEY));

const store = (key: string, value: object | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
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
 * was played here signed out goes into it the first time round: the better of
 * the two counts, and the browser starts again from nothing. Signed out, the
 * browser keeps it, and still shows the records of the account last signed in
 * here. A record the account could not take is kept in the browser, so it is
 * not lost.
 */
export const useRecords = () => {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const queryClient = useQueryClient();
  const [local, setLocal] = useState(readRecords);
  const [seen] = useState(() => stored(SEEN_KEY));

  const account = useQuery({
    queryKey: ['bin-records', userId],
    queryFn: async ({ signal }) => {
      const kept = await getBinRecords(signal);
      const here = readRecords();
      const merged = beats(here, kept) ? await keepBinRecords(bestOf(kept, here)) : kept;
      store(RECORDS_KEY, null);
      return merged;
    },
    enabled: userId !== null,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (userId !== null && account.data) store(SEEN_KEY, { user: userId, ...account.data });
  }, [userId, account.data]);

  const known = userId === null || seen.user === userId ? scores(seen) : NONE;
  const records = bestOf(
    userId !== null && account.data ? bestOf(account.data, local) : local,
    known,
  );

  /** Takes a score in. True when it beat what was there. */
  const score = useCallback(
    (game: Game, points: number) => {
      if (points <= records[game]) return false;
      const keepHere = () => {
        const here = { ...readRecords(), [game]: points };
        store(RECORDS_KEY, here);
        setLocal(here);
      };

      if (userId === null) {
        keepHere();
        return true;
      }
      const next = { ...records, [game]: points };
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
