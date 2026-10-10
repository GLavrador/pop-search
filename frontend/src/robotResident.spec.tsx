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

const press = (name: string | RegExp) => user.click(screen.getByRole('button', { name }));

const tab = (name: string) => screen.getByRole('tab', { name });

const said = () => screen.queryByRole('status');

// jsdom lays nothing out, so the test says what is under the pointer.
const clickThrough = async (node: Element) => {
  document.elementsFromPoint = () => [node];
  await user.click(document.querySelector('[data-help-layer]') as Element);
};

const openAdvanced = async () => {
  await user.click(tab('🔍 Search.exe'));
  await press('▼ Advanced');
};

describe('the robot outside the guide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should explain a setting when its info button is clicked', async () => {
    renderApp();
    await openAdvanced();
    expect(said()).not.toBeInTheDocument();

    await press('What is Search Mode?');

    const balloon = within(screen.getByRole('status'));
    expect(balloon.getByText('Search mode')).toBeInTheDocument();
    expect(balloon.getByText(/It is how I look/)).toBeInTheDocument();
  });

  it('should swap the explanation when another info button is clicked', async () => {
    renderApp();
    await openAdvanced();
    await press('What is Search Mode?');

    await press('What is Match Threshold?');

    const balloon = within(screen.getByRole('status'));
    expect(balloon.getByText('Match threshold')).toBeInTheDocument();
    expect(balloon.queryByText('Search mode')).not.toBeInTheDocument();
  });

  it('should still explain the threshold while the search mode has it switched off', async () => {
    renderApp();
    await openAdvanced();
    await press('Exact');
    expect(screen.getByRole('slider', { name: 'Match threshold' })).toBeDisabled();

    await press('What is Match Threshold?');

    expect(within(screen.getByRole('status')).getByText('Match threshold')).toBeInTheDocument();
  });

  it('should put the explanation away with its own close button', async () => {
    renderApp();
    await openAdvanced();
    await press('What is Search Mode?');

    await user.click(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }));

    expect(said()).not.toBeInTheDocument();
  });

  it('should put the explanation away when the user moves on', async () => {
    renderApp();
    await openAdvanced();
    await press('What is Search Mode?');

    await user.click(screen.getByPlaceholderText('Type to search...'));

    expect(said()).not.toBeInTheDocument();
  });

  it('should explain what is clicked while "what is this" is armed, without using it', async () => {
    renderApp();
    await press("What's this?");
    expect(within(screen.getByRole('status')).getByText(/Click on anything/)).toBeInTheDocument();

    await clickThrough(tab('🔍 Search.exe'));

    expect(within(screen.getByRole('status')).getByText(/where you find a video/)).toBeInTheDocument();
    expect(tab('💿 Add-Video.exe')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: "What's this?" })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should find the explanation of the part a click landed inside', async () => {
    renderApp();
    await press("What's this?");

    await clickThrough(screen.getByText('Ready'));

    expect(within(screen.getByRole('status')).getByText('Status bar')).toBeInTheDocument();
  });

  it('should say what the advanced button does now, not what it did before it was pressed', async () => {
    renderApp();
    await openAdvanced();
    await press("What's this?");

    await clickThrough(screen.getByRole('button', { name: '▲ Hide Advanced' }));

    const balloon = within(screen.getByRole('status'));
    expect(balloon.getByText('Hide advanced')).toBeInTheDocument();
    expect(balloon.getByText(/Tucks the fine settings away/)).toBeInTheDocument();
  });

  it('should keep waiting when the click lands on something it knows nothing about', async () => {
    renderApp();
    await press("What's this?");

    await clickThrough(document.body);

    expect(within(screen.getByRole('status')).getByText(/nothing to say about that/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "What's this?" })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each([
    ['Escape', () => user.keyboard('{Escape}')],
    ['a second press of the button', () => press("What's this?")],
  ])('should stand down on %s', async (_, standDown) => {
    renderApp();
    await press("What's this?");

    await standDown();

    expect(said()).not.toBeInTheDocument();
    expect(document.querySelector('[data-help-layer]')).not.toBeInTheDocument();
  });

  it('should keep the explanation while the user reads it or presses Escape to end it', async () => {
    renderApp();
    await openAdvanced();
    await press('What is Search Mode?');

    await user.click(within(screen.getByRole('status')).getByText('Search mode'));
    expect(said()).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(said()).not.toBeInTheDocument();
  });
});
