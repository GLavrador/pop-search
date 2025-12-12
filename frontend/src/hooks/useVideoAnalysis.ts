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
  
  const abortRef = useRef<boolean>(false);

  const analyze = useCallback(async (url: string) => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    abortRef.current = false;
    
    console.log(`[UseVideoAnalysis] Starting analysis for URL: ${url}`);
    
    try {
      const result = await analyzeVideo(url);
      
      if (abortRef.current) {
        console.log('[UseVideoAnalysis] Analysis cancelled. Ignoring result.');
        return;
      }

      console.log('[UseVideoAnalysis] Success', result);
      setData(result);
    } catch (err: any) {
      if (abortRef.current) return;

      console.error('[UseVideoAnalysis] Error:', err);
      
      let errorMessage = 'Failed to analyze video. Please check backend.';
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 504) {
          errorMessage = 'The AI is taking too long to respond (Timeout). Please try a shorter video (< 1 min).';
        } else if (err.response?.status === 429) {
          errorMessage = 'Rate Limit exceeded. Please wait a minute.';
        } else if (err.response?.data?.detail) {
          errorMessage = `Error: ${err.response.data.detail}`;
        }
      }

      setError(errorMessage);
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analyze, cancel, reset, loading, data, error };
};