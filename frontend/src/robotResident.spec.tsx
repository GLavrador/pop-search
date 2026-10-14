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

const press = (name: string | RegExp) => user.click(screen.getByRole('button', { name }));

const tab = (name: string) => screen.getByRole('tab', { name });

const said = () => screen.queryByRole('status');

// jsdom lays nothing out, so the test says what is under the pointer.
const clickThrough = async (node: Element) => {
  document.elementsFromPoint = () => [node];
  await user.click(document.querySelector('[data-help-layer]') as Element);
};

const theRobot = () => screen.getByRole('button', { name: 'Poke BIP-98' });

// The target gets a place on screen, and the robot is picked up beside it and carried onto it.
const dropAt = async (target: Element) => {
  const box = { left: 300, top: 300, right: 360, bottom: 360, width: 60, height: 60 };
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(box as DOMRect);
  const robot = theRobot();
  await user.pointer([
    { keys: '[MouseLeft>]', target: robot, coords: { clientX: 320, clientY: 320 } },
    { target: robot, coords: { clientX: 330, clientY: 330 } },
    { keys: '[/MouseLeft]', target: robot, coords: { clientX: 330, clientY: 330 } },
  ]);
};

const dropOn = (name: string | RegExp) => dropAt(screen.getByRole('button', { name }));

const EMPTY_BIN = /^(it is empty|nothing to fetch in there|spotless, for now)$/;

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

    await press('What is Precision fine-tuning?');

    const balloon = within(screen.getByRole('status'));
    expect(balloon.getByText('Precision fine-tuning')).toBeInTheDocument();
    expect(balloon.queryByText('Search mode')).not.toBeInTheDocument();
  });

  it('should still explain the threshold while the search mode has it switched off', async () => {
    renderApp();
    await openAdvanced();
    await press('Exact');
    expect(screen.getByRole('slider', { name: 'Match threshold' })).toBeDisabled();

    await press('What is Precision fine-tuning?');

    expect(within(screen.getByRole('status')).getByText('Precision fine-tuning')).toBeInTheDocument();
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

  it('should end "what is this" from the close button of its own balloon', async () => {
    renderApp();
    await press("What's this?");

    await clickThrough(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }));

    expect(said()).not.toBeInTheDocument();
    expect(document.querySelector('[data-help-layer]')).not.toBeInTheDocument();
  });

  it('should not take a click on its own balloon for a question', async () => {
    renderApp();
    await press("What's this?");

    await clickThrough(within(screen.getByRole('status')).getByText(/Click on anything/));

    expect(within(screen.getByRole('status')).getByText(/Click on anything/)).toBeInTheDocument();
  });

  it('should talk about itself without going anywhere when it is the thing clicked', async () => {
    renderApp();
    await press("What's this?");

    await clickThrough(theRobot());

    expect(within(screen.getByRole('status')).getByText(/That is me!/)).toBeInTheDocument();
    expect(document.querySelector('[data-help-layer]')).not.toBeInTheDocument();
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

  it('should only say the bin is empty when it is dropped on it with nothing in there', async () => {
    renderApp();

    await dropOn('Recycle Bin');

    expect(screen.getByText(EMPTY_BIN)).toBeInTheDocument();
    expect(said()).not.toBeInTheDocument();
    expect(document.querySelector('[data-bin-trip]')).not.toBeInTheDocument();
  });

  it('should say so in other words when it is dropped there again', async () => {
    renderApp();
    await dropOn('Recycle Bin');
    const first = screen.getByText(EMPTY_BIN).textContent;

    await dropOn('Recycle Bin');

    expect(screen.getByText(EMPTY_BIN)).not.toHaveTextContent(first ?? '');
  });

  it('should point out that everything already runs inside My Computer', async () => {
    renderApp();

    await dropOn('My Computer');

    expect(
      within(screen.getByRole('status')).getByText(
        /already inside it|already live in it|head is spinning/,
      ),
    ).toBeInTheDocument();
  });

  it('should claim Pop Search as its own when dropped on it', async () => {
    renderApp();

    await dropOn(/Pop Search$/);

    expect(
      within(screen.getByRole('status')).getByText(/already mine|my house|may be biased/),
    ).toBeInTheDocument();
  });

  it('should say what its own icon holds when it is dropped on it', async () => {
    renderApp();

    await dropOn('Tricks');

    expect(
      within(screen.getByRole('status')).getByText(/I tell all|my list of what there is|did not dare/),
    ).toBeInTheDocument();
  });

  it('should read out the time when it is dropped on the clock', async () => {
    renderApp();
    const clock = document.querySelector('[data-robot-zone="clock"]') as HTMLElement;

    await dropAt(clock);

    expect(screen.getByRole('status')).toHaveTextContent(clock.textContent ?? 'no clock');
  });

  it('should have another go at the Start button when it is dropped on it', async () => {
    renderApp();

    await dropOn('Start');

    expect(
      within(screen.getByRole('status')).getByText(/never opened|just for show|Not today/),
    ).toBeInTheDocument();
  });

  it('should warn about the cat when it is dropped on the close button', async () => {
    renderApp();

    await dropOn('Close');

    expect(within(screen.getByRole('status')).getByText(/cat/)).toBeInTheDocument();
  });

  it('should get dizzy when it is shaken from side to side', async () => {
    renderApp();
    const robot = theRobot();
    const to = (clientX: number) => ({ target: robot, coords: { clientX, clientY: 300 } });

    await user.pointer([
      { keys: '[MouseLeft>]', ...to(300) },
      ...[360, 300, 360, 300, 360, 300, 360, 300].map(to),
      { keys: '[/MouseLeft]', ...to(300) },
    ]);

    expect(
      screen.getByText(/^(so dizzy\.\.\.|stop the world!|everything is spinning\.\.\.)$/),
    ).toBeInTheDocument();
  });

  it('should do a somersault on a double click', async () => {
    renderApp();

    await user.dblClick(theRobot());

    expect(screen.getByText(/^(wheee!|watch this!|ta-da!)$/)).toBeInTheDocument();
  });

  it('should ask for a break when it is poked over and over', async () => {
    renderApp();

    for (let i = 0; i < 5; i += 1) await user.click(theRobot());

    expect(
      screen.getByText(/^(enough!|stop, that tickles!|hey, that will do!)$/),
    ).toBeInTheDocument();
  });

  it('should go and hide when the poking does not stop', async () => {
    renderApp();

    for (let i = 0; i < 8; i += 1) await user.click(theRobot());

    expect(
      screen.getByText(/^(that is it, I am hiding!|bye, I am off!|leave me be!)$/),
    ).toBeInTheDocument();
  });

  it('should not take the end of a drag for a poke', async () => {
    renderApp();

    await dropOn('Recycle Bin');

    expect(screen.queryByText(/Beep!|Boop\.|Hm\?|Ouch\.|Zzzt\./)).not.toBeInTheDocument();
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
