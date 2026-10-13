import { useQuery } from '@tanstack/react-query';
import { getSystem } from '../services/api';
import type { SystemReport } from '../types';

export interface SystemView {
  /** What the server said of itself. Null while it is asked, and when it did not answer the last time. */
  report: SystemReport | null;
  /** The last time it was asked, it did not answer. */
  silent: boolean;
  asking: boolean;
  ask: () => void;
}

/** What the server says about itself, asked again every time somebody looks. */
export const useSystemQuery = (): SystemView => {
  const query = useQuery({
    queryKey: ['system'],
    queryFn: ({ signal }) => getSystem(signal),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { refetch } = query;

  return {
    // An answer from before a failure says nothing about now.
    report: query.isError ? null : (query.data ?? null),
    silent: query.isError,
    asking: query.isFetching,
    ask: () => {
      void refetch();
    },
  };
};
