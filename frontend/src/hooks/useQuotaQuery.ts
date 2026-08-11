import { useQuery } from '@tanstack/react-query';
import { getMyQuota } from '../services/api';
import { useAuth } from '../context/authContext';
import type { QuotaStatus } from '../types';

interface UseQuotaQueryReturn {
    quota: QuotaStatus | null;
    isLoading: boolean;
}

export const useQuotaQuery = (): UseQuotaQueryReturn => {
    const { isAuthenticated, session } = useAuth();

    const query = useQuery({
        queryKey: ['quota', session?.user.id],
        queryFn: ({ signal }) => getMyQuota(signal),
        enabled: isAuthenticated,
        // Not cached: an analysis changes it, and a stale counter is worse than
        // a brief spinner.
        staleTime: 0,
        refetchOnMount: 'always',
        retry: false,
    });

    return {
        quota: query.data ?? null,
        isLoading: query.isFetching,
    };
};
