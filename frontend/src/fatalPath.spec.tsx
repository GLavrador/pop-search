import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
const searchVideos = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./services/api', () => ({
  pingServer: vi.fn().mockResolvedValue(undefined),
  getIsAdmin: vi.fn().mockResolvedValue(false),
  getMyVideos: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn(),
  getMyQuota: vi.fn(),
  saveVideo: vi.fn(),
  lookUpPost: vi.fn().mockResolvedValue(null),
  startAnalysis: vi.fn(),
  getAnalysis: vi.fn().mockResolvedValue(null),
  discardAnalysis: vi.fn().mockResolvedValue(undefined),
  searchVideos: (...args: unknown[]) => searchVideos(...args),
  getAllUsage: vi.fn(),
}));

import App from './App';

const SEARCH_TAB = '🔍 Search.exe';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const user = userEvent.setup();

const searchFor = async (words: string) => {
  await user.click(screen.getByRole('tab', { name: SEARCH_TAB }));
  await user.type(screen.getByPlaceholderText('Type to search...'), words);
  await user.click(screen.getByRole('button', { name: 'Find Now' }));
};

describe('searching for the path that took Windows 98 down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    searchVideos.mockResolvedValue([]);
    // React reports every error a boundary catches.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should take the program down without searching for anything', async () => {
    renderApp();

    await searchFor('C:\\con\\con');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'C:\\CON\\CON really did bring Windows 98 down. It does the same here.',
    );
    expect(searchVideos).not.toHaveBeenCalled();
    expect(screen.queryByText(SEARCH_TAB)).not.toBeInTheDocument();
  });

  it('should bring the program back on a key', async () => {
    renderApp();
    await searchFor('c:\\con\\con');

    fireEvent.keyDown(window, { key: 'a' });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
  });

  it('should search as usual for anything that only resembles it', async () => {
    renderApp();

    await searchFor('c:\\con');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchVideos).toHaveBeenCalled();
  });
});
