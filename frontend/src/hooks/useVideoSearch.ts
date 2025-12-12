import { useState, useRef, useCallback } from 'react';
import { searchVideos } from '../services/api';
import type { SearchResult } from '../types';

interface UseVideoSearchReturn {
  search: (query: string) => Promise<void>;
  cancel: () => void;
  results: SearchResult[];
  loading: boolean;
  hasSearched: boolean;
  error: string | null; 
}

export const useVideoSearch = (): UseVideoSearchReturn => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortRef = useRef<boolean>(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    setResults([]); 
    abortRef.current = false;

    try {
      console.log(`[UseVideoSearch] Searching for: ${query}`);
      const data = await searchVideos({ query });
      
      if (abortRef.current) return;

      setResults(data);
    } catch (err: any) {
      if (abortRef.current) return;
      console.error("[UseVideoSearch] Search error", err);
      
      let errorMessage = "Error accessing database index.";
      if (err.response?.status === 504) {
        errorMessage = "Search timed out.";
      } else if (err.response?.data?.detail) {
        errorMessage = `Error: ${err.response.data.detail}`;
      }
      
      setError(errorMessage);
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setLoading(false);
  }, []);

  return { search, cancel, results, loading, hasSearched, error };
};