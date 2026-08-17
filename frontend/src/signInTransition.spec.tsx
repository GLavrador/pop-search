import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
      signOut: vi.fn(),
    },
  },
}));

const getIsAdmin = vi.fn();
const getMyVideos = vi.fn();

vi.mock('./services/api', () => ({
  warmUpBackend: vi.fn(),
  getIsAdmin: (...args: unknown[]) => getIsAdmin(...args),
  getMyVideos: (...args: unknown[]) => getMyVideos(...args),
  getAdminStats: vi.fn().mockResolvedValue({
    avg_tokens: 0, median_tokens: 0, measured: 0, min_tokens: 0, max_tokens: 0,
    analyses: 0, saves: 0, tokens: 0, failure_rate: 0, tokens_wasted: 0,
    analyses_today: 0, daily_limit: 10, projected_tokens_at_limit: 0,
    daily: [], failures_by_reason: [], per_user: [],
  }),
  getMyQuota: vi.fn().mockResolvedValue({ used: 0, limit: 20, remaining: 20, resets_at: '2026-09-01', tokens_this_month: 0 }),
  saveVideo: vi.fn(),
  analyzeVideo: vi.fn(),
  searchVideos: vi.fn(),
  getAllUsage: vi.fn(),
}));

import App from './App';

const session = () =>
  ({
    access_token: 'token-abc',
    user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
  }) as unknown as Session;

describe('signing in without a reload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    getIsAdmin.mockResolvedValue(true);
    getMyVideos.mockResolvedValue([{ id: 'v1', titulo_video: 'Capivara', descricao_completa: '', url_original: 'https://x.com/1', created_at: '2026-08-11T12:00:00+00:00' }]);
  });

  const renderApp = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const resetQueries = vi.spyOn(queryClient, 'resetQueries');
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );
    return { resetQueries };
  };

  const signIn = () => {
    const listener = mockOnAuthStateChange.mock.calls[0][0] as (e: string, s: Session | null) => void;
    act(() => listener('SIGNED_IN', session()));
  };

  it('should show the library and stats tabs as soon as the session arrives', async () => {
    renderApp();

    await waitFor(() => expect(screen.getByText('🔑 Sign In')).toBeInTheDocument());
    expect(screen.queryByText('📁 My-Videos.exe')).not.toBeInTheDocument();
    expect(screen.queryByText('📊 Stats.exe')).not.toBeInTheDocument();

    signIn();

    await waitFor(() => expect(screen.getByText('📁 My-Videos.exe')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('📊 Stats.exe')).toBeInTheDocument());
    expect(getIsAdmin).toHaveBeenCalled();
  });

  it('should drop what was cached under the previous identity', async () => {
    const { resetQueries } = renderApp();
    await waitFor(() => expect(screen.getByText('🔑 Sign In')).toBeInTheDocument());
    expect(resetQueries).not.toHaveBeenCalled();

    signIn();
    await waitFor(() => expect(resetQueries).toHaveBeenCalledTimes(1));

    act(() => {
      const listener = mockOnAuthStateChange.mock.calls[0][0] as (e: string, s: Session | null) => void;
      listener('SIGNED_OUT', null);
    });
    await waitFor(() => expect(resetQueries).toHaveBeenCalledTimes(2));
  });

  it('should not reset on a load that starts already signed in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: session() } });

    const { resetQueries } = renderApp();

    await waitFor(() => expect(screen.getByText('📁 My-Videos.exe')).toBeInTheDocument());
    expect(resetQueries).not.toHaveBeenCalled();
  });
});
