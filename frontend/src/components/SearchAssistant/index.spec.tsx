import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { SearchAssistant } from './index';
import type { AssistantContext } from '../../constants/assistantTips';
import type { SearchResult } from '../../types';

const result = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  id: 'x',
  titulo_video: 'Vídeo',
  url_original: 'http://x.com/x',
  similarity: 0.8,
  text_rank: 0.5,
  score: 0.03,
  ...overrides,
});

const props = (overrides: Partial<AssistantContext> = {}): AssistantContext => ({
  query: '',
  mode: 'hybrid',
  threshold: 0.6,
  hasSearched: false,
  isLoading: false,
  results: [],
  ...overrides,
});

const found = (results: SearchResult[]) =>
  props({ hasSearched: true, query: 'gato', results });

describe('SearchAssistant', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should greet before anything has been typed', () => {
    render(<SearchAssistant {...props()} />);

    expect(screen.getByText(/I am the Pop Search assistant/)).toBeInTheDocument();
  });

  it('should name the threshold that produced nothing', () => {
    render(<SearchAssistant {...props({ hasSearched: true, threshold: 0.85, query: 'gato' })} />);

    expect(screen.getByText(/threshold at 85%/)).toBeInTheDocument();
  });

  it('should report the mix instead of disappearing on a good search', () => {
    render(
      <SearchAssistant
        {...found([
          result({ similarity: 0.8, text_rank: 0.4 }),
          result({ similarity: 0.7, text_rank: 0 }),
          result({ similarity: 0, text_rank: 0.9 }),
        ])}
      />
    );

    expect(
      screen.getByText(/1 by both, 1 by meaning alone, 1 by words alone/)
    ).toBeInTheDocument();
  });

  it('should leave out the origins that produced nothing', () => {
    render(<SearchAssistant {...found([result({ similarity: 0.8, text_rank: 0.4 })])} />);

    const summary = screen.getByText(/Here is the mix/);

    expect(summary).toHaveTextContent('1 by both.');
    expect(summary).not.toHaveTextContent('0 by');
  });

  it('should stay on screen while the search is in flight', () => {
    render(<SearchAssistant {...props({ hasSearched: true, isLoading: true, query: 'gato' })} />);

    expect(screen.getByText(/Asking both sides at once/)).toBeInTheDocument();
  });

  it('should page through the cards of a tip', async () => {
    const user = userEvent.setup();
    render(<SearchAssistant {...props()} />);

    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous tip' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next tip' }));

    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText(/Hybrid mode looks two ways at once/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tip' }));

    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next tip' })).toBeDisabled();
  });

  it('should rewind the deck when the situation changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SearchAssistant {...props()} />);

    await user.click(screen.getByRole('button', { name: 'Next tip' }));
    expect(screen.getByText('2/3')).toBeInTheDocument();

    rerender(<SearchAssistant {...found([result()])} />);

    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('should leave a way back after being dismissed', async () => {
    const user = userEvent.setup();
    render(<SearchAssistant {...props()} />);

    await user.click(screen.getByRole('button', { name: 'Dismiss the assistant' }));
    expect(screen.queryByText(/I am the Pop Search assistant/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show the assistant/ }));
    expect(screen.getByText(/I am the Pop Search assistant/)).toBeInTheDocument();
  });
});
