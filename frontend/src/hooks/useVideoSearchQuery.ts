import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { searchVideos } from '../services/api';
import type { SearchResult } from '../types';

interface UseVideoSearchQueryReturn {
    search: (query: string, threshold: number) => boolean;
    results: SearchResult[];
    isLoading: boolean;
    hasSearched: boolean;
    error: string | null;
}

export const useVideoSearchQuery = (): UseVideoSearchQueryReturn => {
    const [searchQuery, setSearchQuery] = useState<{ query: string; threshold: number } | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const query = useQuery({
        queryKey: ['videoSearch', searchQuery],
        queryFn: ({ signal }) => {
            if (!searchQuery) return [];
            return searchVideos({ query: searchQuery.query, threshold: searchQuery.threshold }, signal);
        },
        enabled: !!searchQuery,
    });

    const getErrorMessage = (error: unknown): string => {
        if (!error) return '';

        const err = error as { response?: { status?: number; data?: { detail?: string } } };
        if (err.response?.status === 429) return 'Too many searches! Please wait a minute and try again.';
        if (err.response?.status === 504) return 'Search timed out.';
        if (err.response?.data?.detail) return `Error: ${err.response.data.detail}`;
        return 'Error accessing database index.';
    };

    const search = (newQuery: string, threshold: number): boolean => {
        if (!newQuery.trim()) return false;    
        if (searchQuery?.query === newQuery && searchQuery?.threshold === threshold) {
            return false;
        }
        setHasSearched(true);
        setSearchQuery({ query: newQuery, threshold });
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
