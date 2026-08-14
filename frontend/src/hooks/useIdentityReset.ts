import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/authContext';

export const useIdentityReset = () => {
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const settled = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (isLoading) return;

    if (!settled.current) {
      settled.current = true;
      lastUserId.current = userId;
      return;
    }

    if (lastUserId.current === userId) return;

    lastUserId.current = userId;
    queryClient.resetQueries();
  }, [isLoading, userId, queryClient]);
};
