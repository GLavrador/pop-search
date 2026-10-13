import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
// The show at full length is the best part of a minute. The tests run it in a blink.
const pace = vi.hoisted(() => ({ value: 0.002 }));

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

vi.mock('./constants/rebuild', () => ({
  get REBUILD_PACE() {
    return pace.value;
  },
  SWALLOW_MS: 20,
}));

import App from './App';

const TRASHED = /^(WHAT DID YOU DO\?!|NOOOO!|MY HOUSE!!)$/;
const DISBELIEF = 'No. No, no, NO. I do not believe this.';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const icon = (name: string | RegExp) => screen.getByRole('button', { name });
const icons = () => [...document.querySelectorAll('[data-robot="icon"]')];
const frame = () => document.querySelector('[data-robot="window"]') as HTMLElement;
const clock = () => document.querySelector('[data-robot="clock"]');
const theRobot = () => screen.queryByRole('button', { name: 'Poke BIP-98' });
const unbuilt = () => icons().filter((each) => each.hasAttribute('data-built'));

// jsdom lays nothing out, so the bin is given a place and the program is let go inside it.
const trashTheProgram = () => {
  vi.spyOn(icon('Recycle Bin'), 'getBoundingClientRect').mockReturnValue({
    left: 8,
    top: 8,
    right: 84,
    bottom: 68,
    width: 76,
    height: 60,
  } as DOMRect);
  const app = icon(/Pop Search$/);
  fireEvent.pointerDown(app, { button: 0, clientX: 40, clientY: 200 });
  fireEvent.pointerMove(app, { clientX: 40, clientY: 30 });
  fireEvent.pointerUp(app, { clientX: 40, clientY: 30 });
};

// Asked on a timer, not at every change the show makes: there are too many for that.
const theShowToEnd = () =>
  waitFor(() => expect(document.querySelector('[data-rebuild]')).toBeNull(), {
    timeout: 20000,
    mutationObserverOptions: { childList: true },
  });

const expectDesktopWhole = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(unbuilt()).toHaveLength(0);
  expect(clock()).toHaveTextContent(/^\d{2}:\d{2}/);
  expect(frame()).toHaveAttribute('aria-hidden', 'false');
  expect(screen.queryByRole('button', { name: 'skip ▸▸' })).not.toBeInTheDocument();
  expect(theRobot()).toBeInTheDocument();
};

describe('throwing the program in the bin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    pace.value = 0.002;
  });

  it('should horrify the robot, then leave nothing of the desktop but a blue screen', async () => {
    pace.value = 1;
    renderApp();

    trashTheProgram();

    expect(screen.getByText(TRASHED)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pop Search was thrown in the Recycle Bin',
    );
    expect(screen.getAllByText('ERROR 0xB1N: PROGRAM_IS_NOT_RUBBISH').length).toBeGreaterThan(0);
    expect(unbuilt()).toHaveLength(4);
    expect(clock()).not.toBeInTheDocument();
    expect(frame()).toHaveAttribute('aria-hidden', 'true');
    expect(theRobot()).not.toBeInTheDocument();

    // And it stays that way for a while: nobody has come to fix it yet.
    await new Promise((done) => setTimeout(done, 300));
    expect(unbuilt()).toHaveLength(4);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should have the robot arrive unable to believe it', async () => {
    // Slow enough for what it says to stay on screen long enough to be found.
    pace.value = 0.05;
    renderApp();

    trashTheProgram();

    expect(await screen.findByText(DISBELIEF, {}, { timeout: 4000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'skip ▸▸' }));
  });

  it('should have the robot rebuild everything and leave the program open', async () => {
    renderApp();

    trashTheProgram();

    await screen.findByRole('alert');
    await theShowToEnd();
    expectDesktopWhole();
  }, 25000);

  it('should put everything back at once when Escape is pressed, and at no other key', async () => {
    pace.value = 1;
    renderApp();
    trashTheProgram();
    await screen.findByRole('alert');
    // The show listens for keys from the moment after it is drawn.
    await act(async () => {});

    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expectDesktopWhole();
  });

  it('should put everything back at once when the show is skipped', async () => {
    pace.value = 1;
    renderApp();
    trashTheProgram();

    fireEvent.click(await screen.findByRole('button', { name: 'skip ▸▸' }));

    expectDesktopWhole();
  });

  it('should only hear the complaint out when asked for less movement', async () => {
    pace.value = 0.05;
    const calm = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation(
        (media) => ({ matches: media.includes('reduce'), media }) as unknown as MediaQueryList,
      );
    renderApp();

    trashTheProgram();

    expect(await screen.findByText(DISBELIEF, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(
      await screen.findByText(/everything back in its place/, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(unbuilt()).toHaveLength(0);
    expect(clock()).toBeInTheDocument();
    await theShowToEnd();
    expectDesktopWhole();
    calm.mockRestore();
  });
});
