import { render, screen, within, fireEvent } from '@testing-library/react';
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

const press = (name: string | RegExp) => user.click(screen.getByRole('button', { name }));
const theRobot = () => screen.getByRole('button', { name: 'Poke BIP-98' });
const tricksIcon = () => screen.getByRole('button', { name: 'Tricks' });
const openList = () => fireEvent.doubleClick(tricksIcon());
const taskbar = () => document.querySelector('[data-robot="taskbar"]') as HTMLElement;
const list = () => screen.queryByRole('dialog', { name: "BIP-98's tricks" });
const said = () => screen.queryByRole('status');

const OPENED = /^(my secrets!|telling everything, are we\?|now you know too much)$/;
const BEEP = /^(Beep!|Boop\.|Hm\?|Ouch\.|Zzzt\.)$/;

describe('the list of what there is to try', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should open from its icon on the desktop on a double click, to a remark from the robot', async () => {
    renderApp();
    expect(list()).not.toBeInTheDocument();

    openList();

    const tricks = within(list() as HTMLElement);
    expect(tricks.getByText('The ? button of the window.')).toBeInTheDocument();
    expect(tricks.getByText('Shake me.')).toBeInTheDocument();
    expect(tricks.getByText('Try to close the window.')).toBeInTheDocument();
    expect(tricks.getByText(/It is C:\\con\\con, exactly like that/)).toBeInTheDocument();
    expect(await screen.findByText(OPENED)).toBeInTheDocument();
  });

  it('should not open on a single click of a mouse, like any other icon', async () => {
    renderApp();

    await user.click(tricksIcon());

    expect(list()).not.toBeInTheDocument();
  });

  it('should leave nothing on the taskbar, open or closed', async () => {
    renderApp();
    const onTheBar = () => within(taskbar()).queryByRole('button', { name: /Tricks/ });
    expect(onTheBar()).not.toBeInTheDocument();

    openList();
    expect(onTheBar()).not.toBeInTheDocument();

    await press('OK');

    expect(list()).not.toBeInTheDocument();
    expect(onTheBar()).not.toBeInTheDocument();
    expect(tricksIcon()).toBeInTheDocument();
  });

  it('should be there for a signed in account as well', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-abc',
          user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
        },
      },
    });
    renderApp();
    await screen.findByText('My-Videos.exe');

    openList();

    expect(list()).toBeInTheDocument();
  });

  it('should start "what is this" from the list, and get out of its way', async () => {
    renderApp();
    openList();

    await press('Try it now');

    expect(list()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: "What's this?" })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(screen.getByRole('status')).getByText(/Click on anything/)).toBeInTheDocument();
  });

  it('should throw itself in the bin from the list, for the robot to be sent after it', async () => {
    renderApp();
    openList();
    expect(within(list() as HTMLElement).getByText('Throw an icon in the Recycle Bin and send me after it.')).toBeInTheDocument();

    await press('Throw these Tricks away');

    expect(list()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tricks' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/my tricks/i);

    await press('Fetch it now');

    expect(document.querySelector('[data-bin-trip]')).toBeInTheDocument();
  });

  it('should be offered by the robot itself when it is poked', async () => {
    renderApp();
    expect(said()).not.toBeInTheDocument();

    await user.click(theRobot());

    expect(screen.getByRole('status')).toHaveTextContent('Feel free to poke around');
    expect(screen.queryByText(BEEP)).not.toBeInTheDocument();

    await press('Peek at the tricks');

    expect(list()).toBeInTheDocument();
    expect(said()).not.toBeInTheDocument();
  });

  it('should drop the subject when it is poked again, and go back to being poked', async () => {
    renderApp();
    await user.click(theRobot());

    await user.click(theRobot());

    expect(said()).not.toBeInTheDocument();
    expect(screen.getByText(BEEP)).toBeInTheDocument();

    await user.click(theRobot());

    expect(said()).not.toBeInTheDocument();
  });

  it('should not offer the list while the list is open', async () => {
    renderApp();
    openList();

    await user.click(theRobot());

    expect(said()).not.toBeInTheDocument();
    expect(screen.getByText(BEEP)).toBeInTheDocument();
  });
});
