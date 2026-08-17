import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { IngestAssistant } from './index';
import type { IngestContext } from '../../constants/ingestTips';

const props = (overrides: Partial<IngestContext> = {}): IngestContext => ({
  url: '',
  manualMode: false,
  isAnalyzing: false,
  hasError: false,
  reviewing: false,
  ...overrides,
});

const POST = 'https://x.com/user/status/123/video/1';

describe('IngestAssistant', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should number the step it is walking the user through', () => {
    render(<IngestAssistant {...props()} />);

    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/Paste the link of an X post/)).toBeInTheDocument();
  });

  it('should reach the last step at the review form', () => {
    render(<IngestAssistant {...props({ url: POST, reviewing: true })} />);

    expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing enters the archive without passing through you/)).toBeInTheDocument();
  });

  it('should turn a rejected link down before the request is spent', () => {
    render(<IngestAssistant {...props({ url: 'https://youtube.com/watch?v=abc' })} />);

    expect(screen.getByText(/not from X or Twitter/)).toBeInTheDocument();
  });

  it('should be honest that a failed analysis still costs quota', () => {
    render(<IngestAssistant {...props({ url: POST, hasError: true })} />);

    expect(screen.getByText(/Failures still count against your quota/)).toBeInTheDocument();
  });

  it('should always say something, unlike the search assistant', () => {
    const { container } = render(<IngestAssistant {...props({ url: POST })} />);

    expect(container).not.toBeEmptyDOMElement();
  });

  it('should keep a way back after being dismissed', async () => {
    const user = userEvent.setup();
    render(<IngestAssistant {...props()} />);

    await user.click(screen.getByRole('button', { name: 'Dismiss the assistant' }));
    expect(screen.queryByText(/Paste the link of an X post/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show the assistant/ }));
    expect(screen.getByText(/Paste the link of an X post/)).toBeInTheDocument();
  });
});
