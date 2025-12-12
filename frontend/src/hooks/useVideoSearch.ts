import { useState, useRef, useCallback } from 'react';
import { searchVideos } from '../services/api';
import type { SearchResult } from '../types';

interface UseVideoSearchReturn {
  search: (query: string) => Promise<void>;
  cancel: () => void;
  results: SearchResult[];
  loading: boolean;
  hasSearched: boolean;
}

export const useVideoSearch = (): UseVideoSearchReturn => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const abortRef = useRef<boolean>(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]); 
    abortRef.current = false;

    try {
      console.log(`[UseVideoSearch] Searching for: ${query}`);
      const data = await searchVideos({ query });
      
      if (abortRef.current) return;

      setResults(data);
    } catch (err) {
      if (abortRef.current) return;
      console.error("[UseVideoSearch] Search error", err);
      alert("Error accessing database index.");
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setLoading(false);
  }, []);

  return { search, cancel, results, loading, hasSearched };
};