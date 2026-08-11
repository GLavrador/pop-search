import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseAdminUsageQuery = vi.fn();
vi.mock('../../hooks/useAdminUsageQuery', () => ({
  useAdminUsageQuery: () => mockUseAdminUsageQuery(),
}));

import { AdminUsage } from './index';

const rows = [
  { user_id: 'u1', display_name: 'Ana', analyses: 4, tokens: 32000, limit: 20 },
  { user_id: 'u2', display_name: 'Bruno', analyses: 1, tokens: 4000, limit: 5 },
];

describe('AdminUsage', () => {
  beforeEach(() => {
    mockUseAdminUsageQuery.mockReturnValue({ isAdmin: true, rows, isLoading: false });
  });

  it('should render nothing for a regular user', () => {
    mockUseAdminUsageQuery.mockReturnValue({ isAdmin: false, rows: [], isLoading: false });

    const { container } = render(<AdminUsage />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should list each account with its analyses against its own limit', () => {
    render(<AdminUsage />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('4 / 20')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('should total both columns so the whole project can be read at a glance', () => {
    render(<AdminUsage />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/36,000|36\.000/)).toBeInTheDocument();
  });

  it('should say which number maps to the Google quota', () => {
    render(<AdminUsage />);

    expect(screen.getByText(/Tokens are what count against the Google AI quota/)).toBeInTheDocument();
  });
});
