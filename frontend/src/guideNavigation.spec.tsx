import { render, screen } from '@testing-library/react';
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

const startGuide = async () => {
  await user.click(await screen.findByRole('button', { name: /Start the guide/i }));
};

const jumpTo = async (step: number) => {
  await user.click(screen.getByRole('button', { name: `Go to step ${step}` }));
};

const tab = (name: string) => screen.getByRole('tab', { name });

describe('guided demo navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should open on the first step with the scripted add screen', async () => {
    renderApp();
    await startGuide();

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 11')).toBeInTheDocument();
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('should rewind the add screen when stepping back', async () => {
    renderApp();
    await startGuide();

    const next = screen.getByRole('button', { name: 'Next ▶' });
    for (let i = 0; i < 5; i += 1) await user.click(next);
    expect(screen.getByText(/Nothing was saved/)).toBeInTheDocument();

    const back = screen.getByRole('button', { name: '◀ Back' });
    for (let i = 0; i < 4; i += 1) await user.click(back);

    expect(screen.getByText('Step 2 of 11')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing was saved/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('should land on the right tab and stage when jumping across tabs', async () => {
    renderApp();
    await startGuide();

    await jumpTo(9);
    expect(screen.getByText('Reading the results')).toBeInTheDocument();
    expect(tab('🔍 Search.exe')).toHaveAttribute('aria-selected', 'true');

    await jumpTo(3);
    expect(screen.getByText('Analysis Options')).toBeInTheDocument();
    expect(tab('💿 Add-Video.exe')).toHaveAttribute('aria-selected', 'true');
  });

  it('should stand aside when the user opens another tab, keeping its place', async () => {
    renderApp();
    await startGuide();
    await jumpTo(3);

    await user.click(tab('🔍 Search.exe'));

    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    expect(screen.getByText('Step 3 of 11')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Take me back/i }));

    expect(screen.getByText('Analysis Options')).toBeInTheDocument();
    expect(tab('💿 Add-Video.exe')).toHaveAttribute('aria-selected', 'true');
  });

  it('should keep its place while hidden and restore the same step', async () => {
    renderApp();
    await startGuide();
    await jumpTo(5);

    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    expect(screen.getByText('Guide paused on step 5 of 11.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Resume/i }));

    expect(screen.getByText('Your turn to check')).toBeInTheDocument();
    expect(screen.getByText('Step 5 of 11')).toBeInTheDocument();
  });

  it('should leave the real search untouched while it runs', async () => {
    renderApp();

    await user.click(tab('🔍 Search.exe'));
    await user.type(screen.getByPlaceholderText('Type to search...'), 'whales');

    await startGuide();
    await jumpTo(9);
    await user.click(screen.getByRole('button', { name: 'End guide' }));

    expect(screen.getByPlaceholderText('Type to search...')).toHaveValue('whales');
  });
});
