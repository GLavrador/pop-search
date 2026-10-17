import { useQuery } from '@tanstack/react-query';
import { getApprovedAccounts, getPendingAccounts } from '../services/api';
import { useAuth } from '../context/authContext';

/** Accounts waiting for approval. Only asked for by an administrator. */
export const usePendingAccountsQuery = (enabled = true) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['pendingAccounts', session?.user.id],
    queryFn: ({ signal }) => getPendingAccounts(signal),
    enabled,
    staleTime: 0,
    retry: false,
  });
};

/** Accounts approved in the last days, with their latest videos. */
export const useApprovedAccountsQuery = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['approvedAccounts', session?.user.id],
    queryFn: ({ signal }) => getApprovedAccounts(signal),
    staleTime: 0,
    retry: false,
  });
};
