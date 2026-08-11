import { useQuery } from '@tanstack/react-query';
import { getAllUsage, getIsAdmin } from '../services/api';
import { useAuth } from '../context/authContext';
import type { UserUsageRow } from '../types';

interface UseAdminUsageQueryReturn {
    isAdmin: boolean;
    rows: UserUsageRow[];
    isLoading: boolean;
}

export const useAdminUsageQuery = (): UseAdminUsageQueryReturn => {
    const { isAuthenticated, session } = useAuth();

    const adminQuery = useQuery({
        queryKey: ['isAdmin', session?.user.id],
        queryFn: ({ signal }) => getIsAdmin(signal),
        enabled: isAuthenticated,
        retry: false,
    });

    const usageQuery = useQuery({
        queryKey: ['allUsage', session?.user.id],
        queryFn: ({ signal }) => getAllUsage(signal),
        enabled: adminQuery.data === true,
        staleTime: 0,
        retry: false,
    });

    return {
        isAdmin: adminQuery.data === true,
        rows: usageQuery.data ?? [],
        isLoading: adminQuery.isFetching || usageQuery.isFetching,
    };
};
