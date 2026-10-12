import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
const pingServer = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./constants/startup', async (original) => ({
  ...(await original<typeof import('./constants/startup')>()),
  SERVER_RETRY_MS: 20,
  SERVER_GIVE_UP_MS: 200,
  SERVER_NOTICE_MS: 40,
}));

vi.mock('./services/api', () => ({
  pingServer: (...args: unknown[]) => pingServer(...args),
  getIsAdmin: vi.fn().mockResolvedValue(false),
  getMyVideos: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn(),
  getMyQuota: vi.fn(),
  saveVideo: vi.fn(),
  lookUpPost: vi.fn().mockResolvedValue(null),
  startAnalysis: vi.fn(),
  getAnalysis: vi.fn().mockResolvedValue(null),
  discardAnalysis: vi.fn().mockResolvedValue(undefined),
  searchVideos: vi.fn(),
  getAllUsage: vi.fn(),
}));

import App from './App';

const WAKING = /The server is still waking up/;
const AWAKE = /^(the server is up!|there, it woke up!|full speed now!)$/;

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

describe('the robot and a server that sleeps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    pingServer.mockResolvedValue(undefined);
  });

  it('should say nothing about a server that answers at once', async () => {
    renderApp();
    await waitFor(() => expect(pingServer).toHaveBeenCalled());

    await new Promise((done) => setTimeout(done, 120));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should explain the wait for a slow server, and say when it is over', async () => {
    let wake = () => {};
    pingServer.mockReturnValue(new Promise<void>((answer) => (wake = answer)));
    renderApp();

    expect(await screen.findByText(WAKING)).toBeInTheDocument();

    wake();

    expect(await screen.findByText(AWAKE)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(WAKING)).not.toBeInTheDocument());
  });

  it('should say so when the server never answers', async () => {
    pingServer.mockRejectedValue(new Error('gone'));

    renderApp();

    expect(await screen.findByText(/The server did not answer/)).toBeInTheDocument();
  });
});
