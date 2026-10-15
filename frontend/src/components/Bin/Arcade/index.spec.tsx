import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { Arcade, type Cartridge } from './index';
import type { Playing } from './play';

interface Counting extends Playing {
  ducked: boolean;
}

const GOAL = 3;

// The simplest game there is: a point for every jump, and it is over on a duck.
const COUNTING: Cartridge<Counting> = {
  goal: GOAL,
  ducks: true,
  create: (width) => ({ width, started: false, over: false, score: 0, ducked: false }),
  step: (state, input) => {
    if (state.over) return state;
    if (input.duck) return { ...state, over: true, ducked: true };
    return input.jump ? { ...state, started: true, score: state.score + 1 } : state;
  },
  View: ({ state }) => <p data-testid="view">{state.started ? 'playing' : 'waiting'}</p>,
};

const COPY = { title: 'Counting', how: 'Press to count', lost: ['It ducked.'] };

const renderArcade = (props: Partial<Parameters<typeof Arcade<Counting>>[0]> = {}) => {
  const handlers = {
    onEarn: vi.fn(),
    onScore: vi.fn(() => true),
    onPoints: vi.fn(),
    onQuit: vi.fn(),
  };
  render(
    <LanguageProvider>
      <Arcade cartridge={COUNTING} copy={COPY} seed={1} best={0} earned={false} {...handlers} {...props} />
    </LanguageProvider>,
  );
  return handlers;
};

const field = () => screen.getByRole('application');
const jump = () => fireEvent.keyDown(window, { code: 'Space' });
const points = () => screen.getByText('Points:').textContent;

// A jump is taken by the next step of the game, so each one is seen before the next is pressed.
const score = async (to: number, from = 0) => {
  for (let now = from + 1; now <= to; now += 1) {
    jump();
    await waitFor(() => expect(points()).toBe(`Points: ${now}`));
  }
};

const lose = async () => {
  fireEvent.keyDown(window, { code: 'ArrowDown' });
  return screen.findByRole('alertdialog', {}, { timeout: 3000 });
};

describe('the window a game is played in', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pop-search:language', 'en');
  });

  it('should wait for the first jump, saying how it is played', () => {
    renderArcade();

    expect(screen.getByText('Press to count')).toBeInTheDocument();
    expect(screen.getByTestId('view')).toHaveTextContent('waiting');
    expect(field()).toHaveFocus();
  });

  it('should take a jump from the keyboard, from the field and from the button for it', async () => {
    renderArcade();

    jump();
    await waitFor(() => expect(points()).toBe('Points: 1'));
    fireEvent.pointerDown(field(), { button: 0 });
    await waitFor(() => expect(points()).toBe('Points: 2'));
    fireEvent.pointerDown(screen.getByRole('button', { name: /Jump/ }));
    await waitFor(() => expect(points()).toBe('Points: 3'));

    expect(screen.queryByText('Press to count')).not.toBeInTheDocument();
  });

  it('should take a jump from a thumb anywhere under the game, not from a mouse there nor twice from a button', async () => {
    renderArcade();
    const under = document.body;

    fireEvent.pointerDown(under, { pointerType: 'touch', clientY: 400 });
    await waitFor(() => expect(points()).toBe('Points: 1'));

    fireEvent.pointerDown(under, { pointerType: 'mouse', clientY: 400 });
    fireEvent.pointerDown(screen.getByRole('button', { name: /Jump/ }), { pointerType: 'touch', clientY: 400 });
    await waitFor(() => expect(points()).toBe('Points: 2'));
    await new Promise((settle) => setTimeout(settle, 120));

    expect(points()).toBe('Points: 2');
  });

  it('should take a duck from the button held for it, for whoever has no keyboard', async () => {
    renderArcade();
    await score(1);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Duck/ }));

    expect(await screen.findByRole('alertdialog', {}, { timeout: 3000 })).toHaveTextContent(
      'It ducked.',
    );
  });

  it('should tell how far the round has got, point by point, and nothing of the goal before it', async () => {
    const { onEarn, onPoints } = renderArcade();

    await score(GOAL - 1);

    expect(onPoints.mock.calls.map(([points]) => points)).toEqual([1, 2]);
    expect(onEarn).not.toHaveBeenCalled();
    expect(screen.queryByText('Rescue unlocked!')).not.toBeInTheDocument();
  });

  it('should leave the rescue itself to somewhere else, with each way out in one place', () => {
    renderArcade({ earned: true });

    expect(screen.queryByRole('button', { name: /Rescue/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Quit the game' })).toHaveLength(1);
  });

  it('should make a moment of reaching the goal, and go on with the game', async () => {
    const { onEarn } = renderArcade();

    await score(GOAL);

    expect(await screen.findByText('Rescue unlocked!')).toBeInTheDocument();
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/^Goal:/).textContent).toBe(`Goal: ${GOAL}`);
    expect(screen.getByRole('img', { name: 'reached' })).toBeInTheDocument();

    await score(GOAL + 2, GOAL);
    expect(onEarn).toHaveBeenCalledTimes(1);
  });

  it('should bring the news of the goal over the window on a phone, in a word, off the game', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (media) =>
        ({
          matches: media.includes('max-width: 620px'),
          media,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    renderArcade();

    await score(GOAL);

    const news = (await screen.findByText('Rescue is by the progress bar.')).closest('[role="status"]');
    expect(news).toHaveTextContent('Rescue unlocked!');
    expect(field()).not.toContainElement(news as HTMLElement);
    vi.restoreAllMocks();
  });

  it('should show the best score, and follow the game when it goes past it', async () => {
    renderArcade({ best: 2 });

    expect(screen.getByText('Best:').textContent).toBe('Best: 2');
    await score(3);

    expect(screen.getByText('Best:').textContent).toBe('Best: 3');
  });

  it('should end a round in a box with the score, the best, and only another go to offer', async () => {
    const { onScore } = renderArcade({ best: 1 });
    await score(2);

    const box = await lose();

    expect(onScore).toHaveBeenCalledWith(2);
    expect(box).toHaveTextContent('It ducked.');
    expect(box).toHaveTextContent('Points: 2. Best: 2.');
    expect(box).toHaveTextContent('New best!');
    expect(box).toHaveTextContent('One point short of the rescue.');
    expect(within(box).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Try again',
    ]);
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
  });

  it('should say in that box where the rescue is, once it was earned', async () => {
    renderArcade({ earned: true });

    const box = await lose();

    expect(box).toHaveTextContent('The rescue is ready, beside the progress bar.');
  });

  it('should start a new round on "Try again", from nothing', async () => {
    renderArcade();
    await score(2);
    await lose();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(points()).toBe('Points: 0');
    expect(screen.getByText('Press to count')).toBeInTheDocument();
    expect(field()).toHaveFocus();
    await score(1);
  });

  it('should count what was scored so far when the game is left in the middle of a round', async () => {
    const { onScore, onQuit } = renderArcade();
    await score(2);

    fireEvent.click(screen.getByRole('button', { name: 'Quit the game' }));

    expect(onScore).toHaveBeenCalledWith(2);
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it('should leave a key pressed on a button to the button', async () => {
    renderArcade();
    await score(1);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Quit the game' }), { code: 'Space' });
    jump();

    await waitFor(() => expect(points()).toBe('Points: 2'));
  });
});
