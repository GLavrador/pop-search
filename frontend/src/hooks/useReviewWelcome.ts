import { useCallback, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useQuotaQuery } from './useQuotaQuery';

const READ_KEY = 'pop-search:review-read:';

const hasRead = (userId: string): boolean => {
  try {
    return localStorage.getItem(READ_KEY + userId) !== null;
  } catch {
    return false;
  }
};

/**
 * Whether an account under review still has to read how the review works,
 * once per account and browser, and the way to say it was read.
 */
export const useReviewWelcome = () => {
  const { session } = useAuth();
  const { quota } = useQuotaQuery();
  const userId = session?.user.id ?? null;
  const [readBy, setReadBy] = useState<string | null>(null);

  const due = userId !== null && quota?.approved === false && readBy !== userId && !hasRead(userId);

  const read = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.setItem(READ_KEY + userId, '1');
    } catch {
      // Without storage it is asked again on the next visit, which does no harm.
    }
    setReadBy(userId);
  }, [userId]);

  return { due, read, analyses: quota?.limit ?? 2 };
};
