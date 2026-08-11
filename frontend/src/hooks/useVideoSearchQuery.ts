import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { searchVideos } from '../services/api';
import type { SearchResult } from '../types';
import type { SearchMode } from '../constants/searchModes';

interface SearchArgs {
    query: string;
    threshold: number;
    limit: number;
    mode: SearchMode;
}

interface UseVideoSearchQueryReturn {
    search: (query: string, threshold: number, limit: number, mode: SearchMode) => boolean;
    results: SearchResult[];
    isLoading: boolean;
    hasSearched: boolean;
    error: string | null;
}

export const useVideoSearchQuery = (): UseVideoSearchQueryReturn => {
    const [searchQuery, setSearchQuery] = useState<SearchArgs | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const query = useQuery({
        queryKey: ['videoSearch', searchQuery],
        queryFn: ({ signal }) => {
            if (!searchQuery) return [];
            return searchVideos(searchQuery, signal);
        },
        enabled: !!searchQuery,
        refetchOnWindowFocus: false,
        retry: false,
    });

    const getErrorMessage = (error: unknown): string => {
        if (!error) return '';

        const err = error as { response?: { status?: number; data?: { detail?: string } } };
        if (err.response?.status === 429) return 'Too many searches! Please wait a minute and try again.';
        if (err.response?.status === 504) return 'Search timed out.';
        if (err.response?.data?.detail) return `Error: ${err.response.data.detail}`;
        return 'Error accessing database index.';
    };

    const search = (newQuery: string, threshold: number, limit: number, mode: SearchMode): boolean => {
        if (!newQuery.trim()) return false;
        if (searchQuery?.query === newQuery && searchQuery?.threshold === threshold && searchQuery?.limit === limit && searchQuery?.mode === mode) {
            return false;
        }
        setHasSearched(true);
        setSearchQuery({ query: newQuery, threshold, limit, mode });
        return true;
    };

    return {
        search,
        results: query.data ?? [],
        isLoading: query.isFetching,
        hasSearched,
        error: query.error ? getErrorMessage(query.error) : null,
    };
};
