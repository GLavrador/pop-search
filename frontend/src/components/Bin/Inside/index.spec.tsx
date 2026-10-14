import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { en } from '../../../i18n/en';

interface FakeArcadeProps {
  copy: { title: string };
  onPoints?: (points: number) => void;
  onEarn: () => void;
  onScore: (points: number) => boolean;
  onQuit: () => void;
}

// The games are tried on their own. Here a stand-in plays them, a button for each thing that can happen.
vi.mock('../Arcade', () => ({
  Arcade: ({ copy, onPoints, onEarn, onScore, onQuit }: FakeArcadeProps) => (
    <section aria-label={copy.title} data-arcade>
      <button type="button" onClick={() => onPoints?.(3)}>
        three points
      </button>
      <button
        type="button"
        onClick={() => {
          onPoints?.(10);
          onEarn();
        }}
      >
        reach the goal
      </button>
      <button type="button" onClick={() => onScore(3)}>
        lose
      </button>
      <button type="button" onClick={onQuit}>
        quit
      </button>
    </section>
  ),
}));

vi.mock('../records', () => ({
  useRecords: () => ({ records: { flappy: 12, dino: 0 }, score: () => false }),
}));

import { Inside } from './index';

const renderInside = () => {
  const handlers = { onRescue: vi.fn(), onLeave: vi.fn() };
  render(
    <LanguageProvider>
      <Inside trashed={['computer']} active greeting={0} {...handlers} />
    </LanguageProvider>,
  );
  return handlers;
};

const calmly = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (media) =>
      ({
        matches: media.includes('prefers-reduced-motion'),
        media,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );

const inside = () => screen.getByRole('dialog', { name: 'Inside the Recycle Bin' });
const bar = () => screen.getByRole('progressbar');
const way = (name: RegExp) => screen.getByRole('button', { name });
const said = () => within(inside()).getAllByRole('status').at(-1)?.textContent;
const theRobot = () => document.querySelector('[data-bin-inside] [class*="keeper"] > span') as Element;

const play = async (game: RegExp, title: string) => {
  fireEvent.click(way(game));
  return screen.findByRole('region', { name: title }, { timeout: 2000 });
};

describe('the inside of the bin', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pop-search:language', 'en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list the ways on in the bin's own window, with the goal and the best of each game", () => {
    renderInside();

    const own = screen.getByRole('region', { name: 'Recycle Bin' });
    expect(within(own).getByRole('heading', { name: 'Recycle Bin' })).toBeInTheDocument();
    expect(
      way(/^Rescue by playing Flappy BIP\. Fly between the menus\. Goal: 10\. Your best: 12\.$/),
    ).toBeInTheDocument();
    expect(way(/^Rescue by playing Dino BIP\. .* Goal: 250\.$/)).toBeInTheDocument();
    expect(way(/^Rescue right away\./)).toBeInTheDocument();
    expect(way(/^Leave\./)).toBeInTheDocument();
  });

  it('should send the robot to press a game, and open it only once it is pressed', async () => {
    renderInside();
    const flappy = way(/Flappy BIP/);

    fireEvent.click(flappy);

    expect(screen.queryByRole('region', { name: 'Flappy BIP' })).not.toBeInTheDocument();
    await waitFor(() => expect(flappy).toHaveAttribute('data-pressed'));
    expect(await screen.findByRole('region', { name: 'Flappy BIP' })).toBeInTheDocument();
  });

  it('should open the game at once for whoever asked for less motion', () => {
    calmly();
    renderInside();

    fireEvent.click(way(/Dino BIP/));

    expect(screen.getByRole('region', { name: 'Dino BIP' })).toBeInTheDocument();
  });

  it('should say it cannot be picked up in here when grabbed at, and then go back to what it was saying', async () => {
    renderInside();
    expect(said()).toBe(en.bin.inside.says[0]);

    fireEvent.pointerDown(theRobot());

    expect(en.bin.inside.untouchable).toContain(said());
    await waitFor(() => expect(said()).toBe(en.bin.inside.says[0]), { timeout: 4000 });
  }, 6000);

  it('should fill the bar as the game is played, and put it back where it was left when the round is lost', async () => {
    renderInside();
    await play(/Flappy BIP/, 'Flappy BIP');

    fireEvent.click(screen.getByRole('button', { name: 'three points' }));
    expect(bar()).toHaveAttribute('aria-valuenow', '37');

    fireEvent.click(screen.getByRole('button', { name: 'lose' }));
    expect(bar()).toHaveAttribute('aria-valuenow', '10');
    expect(screen.queryByRole('button', { name: 'Rescue' })).not.toBeInTheDocument();
  });

  it('should keep the rescue and the full bar once the goal is reached, whatever happens to the round', async () => {
    calmly();
    renderInside();
    await play(/Flappy BIP/, 'Flappy BIP');

    fireEvent.click(screen.getByRole('button', { name: 'reach the goal' }));
    fireEvent.click(screen.getByRole('button', { name: 'lose' }));

    expect(bar()).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('button', { name: 'Rescue' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'quit' }));
    expect(screen.queryByRole('button', { name: /Rescue right away/ })).not.toBeInTheDocument();
  });

  it('should take the game out from under the wear the moment the goal is reached', async () => {
    renderInside();
    await play(/Flappy BIP/, 'Flappy BIP');

    fireEvent.click(screen.getByRole('button', { name: 'reach the goal' }));

    expect(inside()).toHaveAttribute('data-earned');
    expect(inside()).not.toHaveAttribute('data-clean');
  });

  it('should have the robot put the disk in order, in sight, once the game is closed after the goal', async () => {
    renderInside();
    await play(/Flappy BIP/, 'Flappy BIP');
    expect(document.querySelectorAll('[data-error]')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'reach the goal' }));
    fireEvent.click(screen.getByRole('button', { name: 'lose' }));
    fireEvent.click(screen.getByRole('button', { name: 'quit' }));

    const cleaning = new RegExp(en.bin.inside.cleaning.map((line) => line.replace(/[!,.]/g, '.')).join('|'));
    expect(await screen.findByText(cleaning, {}, { timeout: 2000 })).toBeInTheDocument();
    await waitFor(() => expect(inside()).toHaveAttribute('data-clean'), { timeout: 5000 });
    expect(document.querySelectorAll('[data-error]')).toHaveLength(0);
    expect(document.querySelector('[data-bin-sweeper]')).not.toBeInTheDocument();
  }, 8000);

  it('should have the disk in order at once after the goal for whoever asked for less motion', async () => {
    calmly();
    renderInside();
    await play(/Dino BIP/, 'Dino BIP');

    fireEvent.click(screen.getByRole('button', { name: 'reach the goal' }));
    fireEvent.click(screen.getByRole('button', { name: 'quit' }));

    expect(inside()).toHaveAttribute('data-clean');
    expect(document.querySelectorAll('[data-error]')).toHaveLength(0);
  });

  it('should leave the disk as it is while the game is open, even once a round after the goal is lost', async () => {
    renderInside();
    await play(/Flappy BIP/, 'Flappy BIP');

    fireEvent.click(screen.getByRole('button', { name: 'reach the goal' }));
    fireEvent.click(screen.getByRole('button', { name: 'lose' }));
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(document.querySelector('[data-bin-sweeper]')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-error]')).toHaveLength(4);
    expect(inside()).not.toHaveAttribute('data-clean');
  });
});
