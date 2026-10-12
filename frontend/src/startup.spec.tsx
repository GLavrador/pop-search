import { render, screen, fireEvent } from '@testing-library/react';
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
  BOOT_LINE_EVERY_MS: 5,
  BOOT_PATIENCE_MS: 150,
  BOOT_LEAVE_MS: 10,
  BOOT_LEAVE_UNANSWERED_MS: 20,
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

const BOOTED = 'pop-search:booted';
const BIOS = 'Pop Search BIOS 1.0';
const SEARCH_TAB = '🔍 Search.exe';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const asleep = () => pingServer.mockReturnValue(new Promise<void>(() => {}));

describe('starting up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    pingServer.mockResolvedValue(undefined);
  });

  describe('in a tab that has not started yet', () => {
    beforeEach(() => {
      sessionStorage.removeItem(BOOTED);
    });

    it('should begin on the boot screen and open the desktop once the server answers', async () => {
      renderApp();

      expect(screen.getByText(BIOS)).toBeInTheDocument();
      expect(screen.queryByText(SEARCH_TAB)).not.toBeInTheDocument();

      expect(await screen.findByText(SEARCH_TAB)).toBeInTheDocument();
      expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
      expect(sessionStorage.getItem(BOOTED)).not.toBeNull();
    });

    it('should let a key skip the wait for a server that is asleep', () => {
      asleep();
      renderApp();
      expect(screen.getByText(BIOS)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
      expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
    });

    it('should go in on its own when the server takes too long', async () => {
      asleep();
      renderApp();

      expect(await screen.findByText(/Going in without it/)).toBeInTheDocument();
      expect(await screen.findByText(SEARCH_TAB)).toBeInTheDocument();
    });
  });

  it('should go straight to the desktop in a tab that has already started', () => {
    renderApp();

    expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
    expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
  });
});
