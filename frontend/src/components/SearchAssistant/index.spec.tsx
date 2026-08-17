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

  it('should say nothing when the search went fine', () => {
    const { container } = render(
      <SearchAssistant {...props({ hasSearched: true, query: 'gato', results: [result()] })} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should stay quiet mid search rather than flash a stale tip', () => {
    const { container } = render(
      <SearchAssistant {...props({ hasSearched: true, isLoading: true, query: 'gato' })} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should leave a way back after being dismissed', async () => {
    const user = userEvent.setup();
    render(<SearchAssistant {...props()} />);

    await user.click(screen.getByRole('button', { name: 'Dismiss the assistant' }));

    expect(screen.queryByText(/I am the Pop Search assistant/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show the assistant/ }));

    expect(screen.getByText(/I am the Pop Search assistant/)).toBeInTheDocument();
  });

  it('should not offer a way back where it had nothing to say anyway', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SearchAssistant {...props()} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss the assistant' }));
    unmount();

    const { container } = render(
      <SearchAssistant {...props({ hasSearched: true, query: 'gato', results: [result()] })} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
