import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

vi.mock('./hooks/useServerWake', () => ({
  useServerWake: () => ({ state: 'awake', tookMs: 0 }),
}));

import App from './App';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const user = userEvent.setup();

const statusBar = () => within(document.querySelector('[data-robot="status"]') as HTMLElement);

const openSearch = () => user.click(screen.getByRole('tab', { name: 'Search.exe' }));

describe('the status bar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should show how the search is set while the search tab is in front', async () => {
    renderApp();
    expect(statusBar().queryByText('Hybrid')).not.toBeInTheDocument();

    await openSearch();

    expect(statusBar().getByText('Hybrid')).toBeInTheDocument();
    expect(statusBar().getByText('Precision 60%')).toBeInTheDocument();
  });

  it('should follow the precision as it changes', async () => {
    renderApp();
    await openSearch();

    await user.click(screen.getByRole('button', { name: 'Precise' }));

    expect(statusBar().getByText('Precision 75%')).toBeInTheDocument();
  });

  it('should drop the precision in the mode that does not use it', async () => {
    renderApp();
    await openSearch();
    await user.click(screen.getByRole('button', { name: '▼ Advanced' }));

    await user.click(screen.getByRole('button', { name: 'Exact' }));

    expect(statusBar().getByText('Exact')).toBeInTheDocument();
    expect(statusBar().queryByText(/Precision/)).not.toBeInTheDocument();
  });

  it('should keep the message beside the facts', async () => {
    renderApp();
    await openSearch();

    expect(statusBar().getByText('Ready')).toBeInTheDocument();
  });
});
