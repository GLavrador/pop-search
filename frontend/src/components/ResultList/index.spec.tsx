import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RobotContext, type RobotEvent } from '../../context/robotContext';
import { OwnerContext } from '../Dialog/owner';
import type { SearchResult } from '../../types';
import { ResultList } from './index';
import type { Asked } from './Why';

vi.mock('../../context/status', () => ({
  useStatus: () => ({ setStatus: vi.fn() }),
}));

const HYBRID: Asked = { mode: 'hybrid', threshold: 0.6 };
const notify = vi.fn<(event: RobotEvent) => void>();

const band: SearchResult = {
  id: 'band',
  titulo_video: 'A band on stage',
  url_original: 'https://x.com/a/status/1',
  similarity: 0.71,
  text_rank: 0.83,
  vector_position: 2,
  text_position: 1,
  fusion_k: 50,
  matched: 'Show da <<banda>> | A <<banda>> toca enquanto a plateia canta',
};

const giraffe: SearchResult = {
  id: 'giraffe',
  titulo_video: 'A giraffe spinning',
  url_original: 'https://x.com/a/status/2',
  similarity: 0.66,
  text_rank: 0,
  vector_position: 3,
  text_position: null,
  fusion_k: 50,
  matched: null,
};

const list = (results: SearchResult[], asked: Asked | undefined = HYBRID, shown = true) => (
  <OwnerContext.Provider value={shown}>
    <RobotContext.Provider value={{ explain: vi.fn(), notify }}>
      <ResultList results={results} asked={asked} />
    </RobotContext.Provider>
  </OwnerContext.Provider>
);

const whys = () => screen.getAllByRole('button', { name: 'Why?' });
/** Asks why about the result in that place, 1 being the first. */
const ask = (place = 1) => fireEvent.click(whys()[place - 1]);
const reason = () => screen.queryByRole('dialog', { name: 'Why this result?' });
const group = (name: string) => screen.getByRole('group', { name });
const showTheSum = () => fireEvent.click(screen.getByRole('button', { name: 'Show the sum >>' }));
const sumRow = (name: string) => within(screen.getByRole('table')).getByRole('row', { name: new RegExp(`^${name}`) });

describe('the results of a search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show nothing but the cards until one of them is asked about', () => {
    render(list([band, giraffe]));

    expect(screen.getByText('A band on stage')).toBeInTheDocument();
    expect(screen.getByText('A giraffe spinning')).toBeInTheDocument();
    expect(reason()).not.toBeInTheDocument();
  });

  it('should explain a result in a window of its own, in plain words', () => {
    render(list([band, giraffe]));

    ask();

    expect(reason()).toHaveTextContent('A band on stage');
    expect(reason()).toHaveTextContent('1st on the list. It came up for its meaning and for its words.');
    expect(group('Meaning')).toHaveTextContent(
      '2nd among the videos most alike: 71% like what you wrote.',
    );
    expect(group('Words')).toHaveTextContent('1st among the videos that have your words.');
  });

  it('should show where the words were found, with each of them marked', () => {
    render(list([band]));

    ask();

    expect(group('Words')).toHaveTextContent(
      '...Show da banda | A banda toca enquanto a plateia canta...',
    );
    const marked = [...group('Words').querySelectorAll('mark')].map((mark) => mark.textContent);
    expect(marked).toEqual(['banda', 'banda']);
  });

  it('should keep the sum out of sight until it is asked for', () => {
    render(list([band]));
    ask();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(reason()).not.toHaveTextContent('÷');

    showTheSum();

    expect(sumRow('Meaning')).toHaveTextContent('2nd1 ÷ (50 + 2) = 0.0192');
    expect(sumRow('Words')).toHaveTextContent('1st1 ÷ (50 + 1) = 0.0196');
    expect(sumRow('Together')).toHaveTextContent('1st0.0388');
    expect(screen.getByText(/Two lists are made/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '<< Hide the sum' }));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should say when a video below the precision asked got in through its words', () => {
    render(list([{ ...band, similarity: 0.41, vector_position: 7 }]));

    ask();

    expect(reason()).toHaveTextContent('It came up for the words you typed.');
    expect(group('Meaning')).toHaveTextContent('7th among the videos most alike: 41%');
    expect(group('Meaning')).toHaveTextContent('That is under the 60% precision asked.');
  });

  it('should say so when a list did not have the video, and give it no points', () => {
    render(list([band, giraffe]));

    ask(2);

    expect(reason()).toHaveTextContent('2nd on the list. It came up for its meaning');
    expect(group('Words')).toHaveTextContent('Not among the first by words.');

    showTheSum();

    expect(sumRow('Words')).toHaveTextContent('not in it0.0000');
    expect(sumRow('Together')).toHaveTextContent('2nd0.0189');
  });

  it('should leave out the list a mode does not use', () => {
    render(list([band], { mode: 'semantic', threshold: 0.6 }));

    ask();

    expect(reason()).toHaveTextContent('It came up for its meaning');
    expect(group('Words')).toHaveTextContent('This mode does not look for words.');

    showTheSum();

    expect(sumRow('Together')).toHaveTextContent('0.0192');
    expect(screen.getByText(/only one of the two lists is made/)).toBeInTheDocument();
  });

  it('should explain one result at a time', () => {
    render(list([band, giraffe]));

    ask(1);
    ask(2);

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(reason()).toHaveTextContent('A giraffe spinning');
    expect(whys()[1]).toHaveAttribute('aria-expanded', 'true');
    expect(whys()[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close the window on OK', () => {
    render(list([band]));
    ask();

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(reason()).not.toBeInTheDocument();
    expect(whys()[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close the window when its result leaves the list', () => {
    const view = render(list([band, giraffe]));
    ask();

    view.rerender(list([giraffe]));

    expect(reason()).not.toBeInTheDocument();
  });

  it('should close the window when the program it belongs to leaves the screen', () => {
    const view = render(list([band]));
    ask();

    view.rerender(list([band], HYBRID, false));
    view.rerender(list([band], HYBRID, true));

    expect(reason()).not.toBeInTheDocument();
  });

  it('should tell the robot each time another result is asked about', () => {
    render(list([band, giraffe]));

    ask(1);
    ask(1);
    ask(2);

    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledWith({ kind: 'pressed', what: 'why' });
  });

  it('should offer no reason for a result the server sent none for', () => {
    // A server from before the reasons were kept sends neither place.
    const bare = { ...band, vector_position: undefined, text_position: undefined };
    render(list([bare, giraffe]));

    expect(screen.getByText('A band on stage')).toBeInTheDocument();
    expect(whys()).toHaveLength(1);
  });

  it('should offer no reason without the search the results answer', () => {
    render(
      <RobotContext.Provider value={{ explain: vi.fn(), notify }}>
        <ResultList results={[band]} />
      </RobotContext.Provider>,
    );

    expect(screen.queryByRole('button', { name: 'Why?' })).not.toBeInTheDocument();
  });
});
