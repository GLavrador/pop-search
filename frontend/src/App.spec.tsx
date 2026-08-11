import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';

const mockGetSession = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./hooks/useMyVideosQuery', () => ({
  useMyVideosQuery: () => ({ videos: [], isLoading: false, error: null }),
}));

import App from './App';

const signedIn = () =>
  ({
    access_token: 'token-abc',
    user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
  }) as unknown as Session;

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

describe('App access gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should keep search available to visitors', async () => {
    renderApp();

    await waitFor(() => expect(screen.getByText('🔍 Search.exe')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
  });

  it('should replace the ingest form with a prompt when signed out', async () => {
    renderApp();

    await waitFor(() =>
      expect(screen.getByText(/An account is required to add videos/)).toBeInTheDocument(),
    );
    expect(screen.queryByPlaceholderText('https://...')).not.toBeInTheDocument();
  });

  it('should hide the library tab from visitors', async () => {
    renderApp();

    await waitFor(() => expect(screen.getByText('🔑 Sign In')).toBeInTheDocument());
    expect(screen.queryByText('📁 My-Videos.exe')).not.toBeInTheDocument();
  });

  it('should show the ingest form and library once signed in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: signedIn() } });

    renderApp();

    await waitFor(() => expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument());
    expect(screen.getByText('📁 My-Videos.exe')).toBeInTheDocument();
    expect(screen.queryByText(/An account is required/)).not.toBeInTheDocument();
  });
});
