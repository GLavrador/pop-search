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

const press = (name: string) => user.click(screen.getByRole('button', { name }));

const tab = (name: string) => screen.getByRole('tab', { name });

const demo = () => screen.getByText('DEMO').parentElement as HTMLElement;

describe('guided demo navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should open on a reading step, where the assistant holds the way forward', async () => {
    renderApp();
    await startGuide();

    expect(screen.getByText('Hi! I am BIP-98')).toBeInTheDocument();
    expect(screen.getByText('1/12')).toBeInTheDocument();
    expect(screen.getByText('DEMO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Off we go ▶' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'skip ▸' })).not.toBeInTheDocument();
  });

  it('should hand the way forward to the app on a doing step', async () => {
    renderApp();
    await startGuide();
    await press('Off we go ▶');

    expect(screen.getByText('Keeping a video')).toBeInTheDocument();
    expect(screen.getByText('Your turn:')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Got it ▶' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'skip ▸' })).toBeInTheDocument();
  });

  it('should follow the user through the whole add flow', async () => {
    renderApp();
    await startGuide();
    await press('Off we go ▶');

    await press('Next');
    expect(screen.getByText('What the AI looks at')).toBeInTheDocument();

    await press('Run Analysis');
    expect(screen.getByText('The AI is watching')).toBeInTheDocument();

    await press('Skip the wait ▶');
    expect(screen.getByText('Check what the AI wrote')).toBeInTheDocument();

    await press('Got it ▶');
    expect(screen.getByText('Keep it')).toBeInTheDocument();

    await press('Save');
    expect(await screen.findByText('Video kept')).toBeInTheDocument();
    expect(screen.getByText('7/12')).toBeInTheDocument();
  });

  it('should let a doing step be skipped', async () => {
    renderApp();
    await startGuide();
    await jumpTo(2);

    await press('skip ▸');

    expect(screen.getByText('What the AI looks at')).toBeInTheDocument();
  });

  it.each([
    [2, '[data-aim]'],
    [3, '[data-aim]'],
    [6, 'button[type="submit"]'],
    [9, '[data-aim]'],
  ])('should name the real control in the instruction of step %i', async (step, control) => {
    renderApp();
    await startGuide();
    await jumpTo(step);

    const label = demo().querySelector(control)?.textContent ?? 'no control found';

    expect(screen.getByText('Your turn:').parentElement).toHaveTextContent(label);
  });

  it('should rewind the add screen when stepping back', async () => {
    renderApp();
    await startGuide();
    await jumpTo(7);
    expect(screen.getByText(/Saved, in pretend/)).toBeInTheDocument();

    for (let i = 0; i < 5; i += 1) await press('◂ back');

    expect(screen.getByText('2/12')).toBeInTheDocument();
    expect(screen.queryByText(/Saved, in pretend/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('should land on the right tab and stage when jumping across tabs', async () => {
    renderApp();
    await startGuide();

    await jumpTo(10);
    expect(screen.getByText('What came up')).toBeInTheDocument();
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
    expect(screen.getByText('3/12')).toBeInTheDocument();

    await press('Take me back');

    expect(screen.getByText('Analysis Options')).toBeInTheDocument();
    expect(tab('💿 Add-Video.exe')).toHaveAttribute('aria-selected', 'true');
  });

  it('should keep its place while closed and restore the same step', async () => {
    renderApp();
    await startGuide();
    await jumpTo(5);

    await press('Close the guide');

    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    expect(screen.getByText('Guide paused on step 5 of 12.')).toBeInTheDocument();

    await press('▶ Resume');

    expect(screen.getByText('Check what the AI wrote')).toBeInTheDocument();
    expect(screen.getByText('5/12')).toBeInTheDocument();
  });

  it('should end on the last step and keep offering the guide, on every tab', async () => {
    renderApp();
    await startGuide();
    await jumpTo(12);

    await press('Finish ✓');

    expect(screen.queryByText('12/12')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶ See the guide again' })).toBeInTheDocument();

    await user.click(tab('🔍 Search.exe'));

    expect(screen.getByRole('button', { name: '▶ See the guide again' })).toBeInTheDocument();
  });

  it('should move into the title bar when tucked away, and still open the guide', async () => {
    renderApp();
    await user.click(await screen.findByRole('button', { name: /Tuck this away/ }));

    expect(screen.queryByRole('button', { name: /Start the guide/i })).not.toBeInTheDocument();

    await user.click(tab('🔍 Search.exe'));
    await press('Guide: let BIP-98 show you around');

    expect(screen.getByText('Hi! I am BIP-98')).toBeInTheDocument();
  });

  it('should stay tucked away on the next visit', async () => {
    localStorage.setItem('pop-search:guide-invite', 'tucked');
    renderApp();

    expect(
      await screen.findByRole('button', { name: 'Guide: let BIP-98 show you around' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start the guide/i })).not.toBeInTheDocument();
  });

  it('should leave signed in accounts alone: for them the guide lives in the profile', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-abc',
          user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
        },
      },
    });
    renderApp();

    await screen.findByText('📁 My-Videos.exe');

    expect(screen.queryByRole('button', { name: /Start the guide/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Guide: let BIP-98 show you around' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /👤/ }));

    expect(screen.getByRole('button', { name: '▶ Open the guide' })).toBeInTheDocument();
  });

  it('should leave the real search untouched while it runs', async () => {
    renderApp();

    await user.click(tab('🔍 Search.exe'));
    await user.type(screen.getByPlaceholderText('Type to search...'), 'whales');

    await startGuide();
    await jumpTo(10);
    await press('Close the guide');
    await press('end guide');

    expect(screen.getByPlaceholderText('Type to search...')).toHaveValue('whales');
  });
});
