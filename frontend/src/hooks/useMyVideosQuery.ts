import { useQuery } from '@tanstack/react-query';
import { getMyVideos } from '../services/api';
import { useAuth } from '../context/authContext';
import type { MyVideo } from '../types';

interface UseMyVideosQueryReturn {
    videos: MyVideo[];
    isLoading: boolean;
    error: string | null;
}

export const useMyVideosQuery = (): UseMyVideosQueryReturn => {
    const { isAuthenticated, session } = useAuth();

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
        if (err.response?.status === 401) return 'Your session expired. Sign in again.';
        if (err.response?.status === 429) return 'Too many requests. Wait a minute and try again.';
        return 'Could not load your videos.';
    };

    return {
        videos: query.data ?? [],
        isLoading: query.isFetching,
        error: query.error ? getErrorMessage(query.error) : null,
    };
};
