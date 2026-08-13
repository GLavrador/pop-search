import { useQuery } from '@tanstack/react-query';
import { getAdminStats, getIsAdmin } from '../services/api';
import { useAuth } from '../context/authContext';
import { useI18n } from '../i18n/languageContext';
import type { AdminStatsReport } from '../types';

export const RANGE_OPTIONS = [7, 30, 90] as const;

interface UseAdminStatsQueryReturn {
    isAdmin: boolean;
    stats: AdminStatsReport | null;
    isLoading: boolean;
    error: string | null;
}

export const useAdminStatsQuery = (days: number): UseAdminStatsQueryReturn => {
    const { isAuthenticated, session } = useAuth();
    const { t } = useI18n();

    const adminQuery = useQuery({
        queryKey: ['isAdmin', session?.user.id],
        queryFn: ({ signal }) => getIsAdmin(signal),
        enabled: isAuthenticated,
        retry: false,
    });

    const statsQuery = useQuery({
        queryKey: ['adminStats', session?.user.id, days],
        queryFn: ({ signal }) => getAdminStats(days, signal),
        enabled: adminQuery.data === true,
        staleTime: 0,
        retry: false,
    });

    return {
        isAdmin: adminQuery.data === true,
        stats: statsQuery.data ?? null,
        isLoading: adminQuery.isFetching || statsQuery.isFetching,
        error: statsQuery.error ? t.admin.loadFailed : null,
    };
};
