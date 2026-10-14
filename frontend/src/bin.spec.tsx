import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

vi.mock('./constants/rebuild', () => ({ REBUILD_PACE: 0.002, SWALLOW_MS: 20 }));

import App from './App';
import { en } from './i18n/en';
import { RECORDS_KEY } from './components/Bin/records';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const user = userEvent.setup();

const icon = (name: string | RegExp) => screen.getByRole('button', { name });
const onDesktop = (name: string) => screen.queryByRole('button', { name });
const binPicture = () => icon('Recycle Bin').querySelector('img');
const theRobot = () => screen.queryByRole('button', { name: 'Poke BIP-98' });
const theScene = () => document.querySelector('[data-bin-trip]');
const inside = () => screen.queryByRole('dialog', { name: 'Inside the Recycle Bin' });
const said = () => screen.queryByRole('status');

const GOING = [...en.bin.going.reluctant, ...en.bin.going.willing];
const EMPTY = /^(it is empty|nothing to fetch in there|spotless, for now)$/;
const BEEP = /^(Beep!|Boop\.|Hm\?|Ouch\.|Zzzt\.)$/;

// jsdom lays nothing out, so the bin is given a place and the icon is let go inside it.
const throwAway = (name: string | RegExp) => {
  vi.spyOn(icon('Recycle Bin'), 'getBoundingClientRect').mockReturnValue({
    left: 8,
    top: 8,
    right: 84,
    bottom: 68,
    width: 76,
    height: 60,
  } as DOMRect);
  const thrown = icon(name);
  fireEvent.pointerDown(thrown, { button: 0, clientX: 40, clientY: 200 });
  fireEvent.pointerMove(thrown, { clientX: 40, clientY: 30 });
  fireEvent.pointerUp(thrown, { clientX: 40, clientY: 30 });
};

const openBin = () => fireEvent.doubleClick(icon('Recycle Bin'));
const skipScene = () => fireEvent.click(screen.getByRole('button', { name: 'skip ▸▸' }));

/** In the bin, past the scene of getting there, with these icons thrown away. */
const goInAfter = (...names: string[]) => {
  names.forEach((name) => throwAway(name));
  openBin();
  skipScene();
  return within(inside() as HTMLElement);
};

describe('the recycle bin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should take an icon off the desktop, look full, and have the robot offer to fetch it', () => {
    renderApp();
    expect(binPicture()).not.toHaveAttribute('data-full');

    throwAway('My Computer');

    expect(onDesktop('My Computer')).not.toBeInTheDocument();
    expect(binPicture()).toHaveAttribute('data-full');
    expect(said()).toHaveTextContent(/My Computer.*open the Recycle Bin/i);
    expect(screen.getByRole('button', { name: 'Fetch it now' })).toBeInTheDocument();
    expect(onDesktop('Tricks')).toBeInTheDocument();
  });

  it('should have something else to say when it is the tricks that go', () => {
    renderApp();

    throwAway('Tricks');

    expect(onDesktop('Tricks')).not.toBeInTheDocument();
    expect(said()).toHaveTextContent(/my tricks/i);
  });

  it('should only remark that it is empty when it is opened with nothing in it', () => {
    renderApp();

    openBin();

    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(theScene()).not.toBeInTheDocument();
    expect(theRobot()).toBeInTheDocument();
  });

  it('should send the robot in after what was thrown away, saying something on the way', () => {
    renderApp();
    throwAway('My Computer');

    openBin();

    expect(theScene()).toBeInTheDocument();
    expect(theRobot()).not.toBeInTheDocument();
    expect(GOING).toContain(said()?.textContent);
    expect(inside()).not.toBeInTheDocument();
  });

  it('should send it in from the offer in its balloon as well', async () => {
    renderApp();
    throwAway('My Computer');

    await user.click(screen.getByRole('button', { name: 'Fetch it now' }));

    expect(theScene()).toBeInTheDocument();
  });

  it('should send it in when the robot itself is dropped on a bin with something in it', async () => {
    renderApp();
    throwAway('Tricks');
    const robot = theRobot() as HTMLElement;

    await user.pointer([
      { keys: '[MouseLeft>]', target: robot, coords: { clientX: 320, clientY: 320 } },
      { target: robot, coords: { clientX: 40, clientY: 30 } },
      { keys: '[/MouseLeft]', target: robot, coords: { clientX: 40, clientY: 30 } },
    ]);

    expect(theScene()).toBeInTheDocument();
  });

  it('should not say the same thing on the way in twice running', () => {
    renderApp();
    throwAway('My Computer');
    const heard: (string | null | undefined)[] = [];

    for (let visit = 0; visit < 4; visit += 1) {
      openBin();
      heard.push(said()?.textContent);
      skipScene();
      fireEvent.click(within(inside() as HTMLElement).getByRole('button', { name: /Leave/ }));
      skipScene();
    }

    heard.forEach((line, visit) => {
      expect(GOING).toContain(line);
      if (visit > 0) expect(line).not.toBe(heard[visit - 1]);
    });
  }, 15000);

  it('should be inside once the scene is over, with what was thrown away and four ways on', () => {
    renderApp();

    const bin = goInAfter('My Computer', 'Tricks');

    expect(theScene()).not.toBeInTheDocument();
    expect(bin.getByText('My Computer')).toBeInTheDocument();
    expect(bin.getByText('Tricks')).toBeInTheDocument();
    expect(en.bin.inside.says).toContain(bin.getByRole('status').textContent);
    expect(bin.getByRole('button', { name: /Flappy BIP.*Goal: 10/ })).toBeInTheDocument();
    expect(bin.getByRole('button', { name: /Dino BIP.*Goal: 250/ })).toBeInTheDocument();
    expect(bin.getByRole('button', { name: /Rescue right away/ })).toBeInTheDocument();
    expect(bin.getByRole('button', { name: /Leave/ })).toBeInTheDocument();
    expect(inside()).toHaveFocus();
  });

  it('should be a Defragmenter stuck at ten percent, with no rescue by its bar until the goal is reached', () => {
    renderApp();

    const bin = goInAfter('My Computer');

    const bar = bin.getByRole('progressbar', { name: 'Defragmenting Drive C' });
    expect(bar).toHaveAttribute('aria-valuenow', '10');
    expect(bin.getByText('10% complete')).toBeInTheDocument();
    expect(bin.getByRole('button', { name: 'Stop' })).toBeDisabled();
    expect(bin.queryByRole('button', { name: 'Rescue' })).not.toBeInTheDocument();
  });

  it('should open the legend of the Defragmenter, and keep the rest out of reach while it is open', async () => {
    renderApp();
    const bin = goInAfter('My Computer');

    await user.click(bin.getByRole('button', { name: 'Legend' }));

    const legend = screen.getByRole('dialog', { name: 'Defrag Legend' });
    expect(legend).toHaveTextContent('Forgotten data');
    await user.click(within(legend).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Defrag Legend' })).not.toBeInTheDocument();
  });

  it('should get there on Escape as well', () => {
    renderApp();
    throwAway('My Computer');
    openBin();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(inside()).toBeInTheDocument();
  });

  it('should get there by itself when the scene is left to play', async () => {
    renderApp();
    throwAway('My Computer');

    openBin();

    await waitFor(() => expect(theScene()).not.toBeInTheDocument(), { timeout: 14000 });
    expect(inside()).toHaveFocus();
  }, 16000);

  it('should ask before rescuing without the challenge, and take no for an answer', async () => {
    renderApp();
    const bin = goInAfter('My Computer');

    await user.click(bin.getByRole('button', { name: /Rescue right away/ }));

    const box = screen.getByRole('alertdialog', { name: 'Recycle Bin' });
    expect(box).toHaveTextContent('Are you sure?');
    expect(within(box).getByRole('button', { name: 'Yes' })).toHaveFocus();

    await user.click(within(box).getByRole('button', { name: 'No' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(inside()).toBeInTheDocument();
    expect(onDesktop('My Computer')).not.toBeInTheDocument();
  });

  it('should take Escape for a no', async () => {
    renderApp();
    const bin = goInAfter('My Computer');
    await user.click(bin.getByRole('button', { name: /Rescue right away/ }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(inside()).toBeInTheDocument();
  });

  it('should bring everything back to the desktop on a yes, the robot with it', async () => {
    renderApp();
    const bin = goInAfter('My Computer', 'Tricks');

    await user.click(bin.getByRole('button', { name: /Rescue right away/ }));
    await user.click(screen.getByRole('button', { name: 'Yes' }));

    expect(theScene()).toBeInTheDocument();
    skipScene();

    expect(inside()).not.toBeInTheDocument();
    expect(theScene()).not.toBeInTheDocument();
    expect(onDesktop('My Computer')).toBeInTheDocument();
    expect(onDesktop('Tricks')).toBeInTheDocument();
    expect(binPicture()).not.toHaveAttribute('data-full');
    expect(theRobot()).toBeInTheDocument();
  });

  it('should say they are rescued once out, when the way out is left to play', async () => {
    renderApp();
    const bin = goInAfter('My Computer');
    await user.click(bin.getByRole('button', { name: /Rescue right away/ }));
    await user.click(screen.getByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(en.bin.back.rescued).toContain(said()?.textContent), {
      timeout: 6000,
    });

    expect(onDesktop('My Computer')).toBeInTheDocument();
    await waitFor(() => expect(theScene()).not.toBeInTheDocument(), { timeout: 8000 });
    expect(theRobot()).toBeInTheDocument();
  }, 16000);

  it('should come back without them on "Leave", and keep them for another visit', async () => {
    renderApp();
    const bin = goInAfter('My Computer');

    await user.click(bin.getByRole('button', { name: /Leave/ }));
    skipScene();

    expect(inside()).not.toBeInTheDocument();
    expect(onDesktop('My Computer')).not.toBeInTheDocument();
    expect(binPicture()).toHaveAttribute('data-full');
    expect(theRobot()).toBeInTheDocument();

    openBin();
    expect(theScene()).toBeInTheDocument();
  });

  it('should open a game from the choice, and come back to the choice from it', async () => {
    renderApp();
    const bin = goInAfter('My Computer');

    await user.click(bin.getByRole('button', { name: /Dino BIP/ }));

    // The robot flies over and presses it first.
    expect(await bin.findByRole('application', { name: /Dino BIP/ }, { timeout: 2000 })).toHaveFocus();
    expect(bin.queryByRole('button', { name: /Leave/ })).not.toBeInTheDocument();

    await user.click(bin.getByRole('button', { name: 'Quit the game' }));

    expect(bin.queryByRole('application')).not.toBeInTheDocument();
    expect(bin.getByRole('button', { name: /Leave/ })).toBeInTheDocument();
  });

  it('should show the best score kept from an earlier visit', () => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify({ flappy: 12, dino: 0 }));
    renderApp();

    const bin = goInAfter('My Computer');

    expect(bin.getByRole('button', { name: /Flappy BIP.*Your best: 12/ })).toBeInTheDocument();
    expect(bin.getByRole('button', { name: /Dino BIP/ })).not.toHaveTextContent('Your best');
  });

  it('should not offer the list of tricks while the list is in the bin', async () => {
    renderApp();
    throwAway('Tricks');
    await user.click(document.querySelector('[data-robot-dismiss]') as HTMLElement);

    await user.click(theRobot() as HTMLElement);

    expect(said()).not.toBeInTheDocument();
    expect(screen.getByText(BEEP)).toBeInTheDocument();
  });

  it('should go in without the flying about for whoever asked for less motion', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (media) =>
        ({
          matches: media.includes('prefers-reduced-motion'),
          media,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    renderApp();
    throwAway('My Computer');

    openBin();

    expect(GOING).toContain(said()?.textContent);
    await waitFor(() => expect(theScene()).not.toBeInTheDocument(), { timeout: 5000 });
    expect(inside()).toBeInTheDocument();
    expect(icon('Recycle Bin').style.transform).toBe('');
  }, 8000);

  it('should have every icon back when the program itself is thrown in after them', async () => {
    renderApp();
    throwAway('My Computer');

    throwAway(/Pop Search$/);
    await waitFor(() => expect(document.querySelector('[data-rebuild]')).toBeInTheDocument());
    await waitFor(() => expect(document.querySelector('[data-rebuild]')).toBeNull(), {
      timeout: 20000,
    });

    expect(onDesktop('My Computer')).toBeInTheDocument();
    expect(binPicture()).not.toHaveAttribute('data-full');
  }, 25000);
});
