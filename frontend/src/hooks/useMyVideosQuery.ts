import { useQuery } from '@tanstack/react-query';
import { getMyVideos } from '../services/api';
import { useAuth } from '../context/authContext';
import { useI18n } from '../i18n/languageContext';
import type { MyVideo } from '../types';

interface UseMyVideosQueryReturn {
    videos: MyVideo[];
    isLoading: boolean;
    error: string | null;
}

export const useMyVideosQuery = (): UseMyVideosQueryReturn => {
    const { isAuthenticated, session } = useAuth();
    const { t } = useI18n();

    const query = useQuery({
        // Keyed by user so switching accounts cannot show the previous library.
        queryKey: ['myVideos', session?.user.id],
        queryFn: ({ signal }) => getMyVideos(signal),
        enabled: isAuthenticated,
        refetchOnWindowFocus: false,
        retry: false,
    });

    const getErrorMessage = (error: unknown): string => {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) return t.myVideos.errors.expired;
        if (err.response?.status === 429) return t.myVideos.errors.rateLimited;
        return t.myVideos.errors.generic;
    };

    return {
        videos: query.data ?? [],
        isLoading: query.isFetching,
        error: query.error ? getErrorMessage(query.error) : null,
    };
};
