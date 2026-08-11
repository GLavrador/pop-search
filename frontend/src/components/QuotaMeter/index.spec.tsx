import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseQuotaQuery = vi.fn();
vi.mock('../../hooks/useQuotaQuery', () => ({
  useQuotaQuery: () => mockUseQuotaQuery(),
}));

import { QuotaMeter } from './index';

const quota = (overrides = {}) => ({
  used: 7,
  limit: 20,
  remaining: 13,
  resets_at: '2026-09-01T00:00:00+00:00',
  ...overrides,
});

describe('QuotaMeter', () => {
  beforeEach(() => {
    mockUseQuotaQuery.mockReturnValue({ quota: quota(), isLoading: false });
  });

  it('should show what has been used against the limit', () => {
    render(<QuotaMeter />);

    expect(screen.getByText('7 / 20')).toBeInTheDocument();
    expect(screen.getByText(/13 left/)).toBeInTheDocument();
  });

  it('should expose progress to assistive tech', () => {
    render(<QuotaMeter />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '7');
    expect(bar).toHaveAttribute('aria-valuemax', '20');
  });

  it('should say what is still possible once the limit is reached', () => {
    mockUseQuotaQuery.mockReturnValue({
      quota: quota({ used: 20, remaining: 0 }),
      isLoading: false,
    });

    render(<QuotaMeter />);

    expect(screen.getByText(/Limit reached/)).toBeInTheDocument();
    expect(screen.getByText(/add videos manually/)).toBeInTheDocument();
  });

  it('should show the reset date in UTC, not shifted by the local zone', () => {
    // Midnight UTC on the 1st is the previous evening in the Americas, which
    // would tell the user the quota renews before the month is over.
    render(<QuotaMeter />);

    expect(screen.getByText(/renews on/)).toHaveTextContent('2026');
    expect(screen.queryByText(/31/)).not.toBeInTheDocument();
  });

  it('should render nothing when there is no quota to show', () => {
    mockUseQuotaQuery.mockReturnValue({ quota: null, isLoading: false });

    const { container } = render(<QuotaMeter />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should not divide by zero on a limit of zero', () => {
    mockUseQuotaQuery.mockReturnValue({
      quota: quota({ used: 0, limit: 0, remaining: 0 }),
      isLoading: false,
    });

    render(<QuotaMeter />);

    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '0%' });
  });
});
