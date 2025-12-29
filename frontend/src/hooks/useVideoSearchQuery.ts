import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { searchVideos } from '../services/api';
import type { SearchResult } from '../types';

interface UseVideoSearchQueryReturn {
    search: (query: string) => void;
    results: SearchResult[];
    isLoading: boolean;
    hasSearched: boolean;
    error: string | null;
}

export const useVideoSearchQuery = (): UseVideoSearchQueryReturn => {
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const query = useQuery({
        queryKey: ['videoSearch', searchQuery],
        queryFn: ({ signal }) => {
            if (!searchQuery) return [];
            return searchVideos({ query: searchQuery }, signal);
        },
        enabled: !!searchQuery,
    });

    const getErrorMessage = (error: unknown): string => {
        if (!error) return '';

        const err = error as any;
        if (err.response?.status === 504) return 'Search timed out.';
        if (err.response?.data?.detail) return `Error: ${err.response.data.detail}`;
        return 'Error accessing database index.';
    };

    const search = (newQuery: string) => {
        if (!newQuery.trim()) return;
        setHasSearched(true);
        setSearchQuery(newQuery);
    };

    return {
        search,
        results: query.data ?? [],
        isLoading: query.isFetching,
        hasSearched,
        error: query.error ? getErrorMessage(query.error) : null,
    };
};
