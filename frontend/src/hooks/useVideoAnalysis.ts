import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { analyzeVideo } from '../services/api'; 
import type { VideoMetadata } from '../types';

interface UseVideoAnalysisReturn {
  analyze: (url: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  loading: boolean;
  data: VideoMetadata | null;
  error: string | null;
}

export const useVideoAnalysis = (): UseVideoAnalysisReturn => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (url: string) => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      console.log(`[UseVideoAnalysis] Starting analysis for: ${url}`);
      const result = await analyzeVideo(url, abortControllerRef.current.signal);

      setData(result);

    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'AbortError') {
        console.log('[UseVideoAnalysis] Request aborted by user.');
        return;
      }

      console.error('[UseVideoAnalysis] Error:', err);
      
      let errorMessage = 'Failed to analyze video.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 504) errorMessage = 'Server Timeout (504). Video might be too long.';
        else if (err.response?.status === 429) errorMessage = 'Rate Limit Exceeded (429). Please wait.';
        else if (err.response?.data?.detail) errorMessage = `Error: ${err.response.data.detail}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analyze, cancel, reset, loading, data, error };
};