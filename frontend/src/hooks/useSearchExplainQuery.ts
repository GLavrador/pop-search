import { useQuery } from '@tanstack/react-query';
import { explainSearch } from '../services/api';
import type { SearchExplain } from '../types';
import type { SearchMode } from '../constants/searchModes';

interface ExplainArgs {
  query: string;
  threshold: number;
  limit: number;
  mode: SearchMode;
}

interface UseSearchExplainQueryReturn {
  explain: SearchExplain | null;
  isLoading: boolean;
  failed: boolean;
}

export const useSearchExplainQuery = (
  args: ExplainArgs | null,
  enabled: boolean
): UseSearchExplainQueryReturn => {
  const query = useQuery({
    queryKey: ['searchExplain', args],
    queryFn: ({ signal }) => {
      if (!args) return null;
      return explainSearch(args, signal);
    },
    enabled: enabled && !!args,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    explain: query.data ?? null,
    isLoading: query.isFetching,
    failed: !!query.error,
  };
};
