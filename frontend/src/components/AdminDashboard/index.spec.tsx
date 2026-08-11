import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseAdminStatsQuery = vi.fn();
vi.mock('../../hooks/useAdminStatsQuery', () => ({
  RANGE_OPTIONS: [7, 30, 90],
  useAdminStatsQuery: (days: number) => mockUseAdminStatsQuery(days),
}));

import { AdminDashboard } from './index';

const stats = (overrides = {}) => ({
  range_days: 30,
  analyses: 42,
  saves: 10,
  tokens: 240000,
  avg_tokens: 5714,
  median_tokens: 5200,
  min_tokens: 2651,
  max_tokens: 10890,
  measured: 40,
  failures: 2,
  failure_rate: 0.048,
  tokens_wasted: 12000,
  failures_by_reason: [{ reason: 'blocked:SAFETY', count: 2 }],
  daily: [
    { date: '2026-08-10', analyses: 2, tokens: 11000 },
    { date: '2026-08-11', analyses: 4, tokens: 22000 },
  ],
  analyses_today: 4,
  daily_limit: 100,
  projected_tokens_at_limit: 571400,
  per_user: [{ user_id: 'u1', display_name: 'Ana', analyses: 4, tokens: 32000, limit: 20 }],
  ...overrides,
});

const asAdmin = (overrides = {}) => ({
  isAdmin: true,
  stats: stats(overrides),
  isLoading: false,
  error: null,
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockUseAdminStatsQuery.mockReturnValue(asAdmin());
  });

  it('should refuse to render for a regular user', () => {
    mockUseAdminStatsQuery.mockReturnValue({
      isAdmin: false, stats: null, isLoading: false, error: null,
    });

    render(<AdminDashboard />);

    expect(screen.getByText(/for administrators/)).toBeInTheDocument();
    expect(screen.queryByText('Project statistics')).not.toBeInTheDocument();
  });

  it('should show the spread, not just the average', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/5,714|5\.714/)).toBeInTheDocument();
    expect(screen.getByText(/median 5,200|median 5\.200/)).toBeInTheDocument();
    expect(screen.getByText(/2,651 \/ 10,890|2\.651 \/ 10\.890/)).toBeInTheDocument();
  });

  it('should report what a full day at the ceiling would cost', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/571,400|571\.400/)).toBeInTheDocument();
  });

  it('should say how many tokens the failures burned', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('4.8%')).toBeInTheDocument();
    expect(screen.getByText(/12,000 tokens spent for nothing|12\.000 tokens spent for nothing/)).toBeInTheDocument();
    expect(screen.getByText('blocked:SAFETY')).toBeInTheDocument();
  });

  it('should warn when the ceiling has stopped everyone', () => {
    mockUseAdminStatsQuery.mockReturnValue(asAdmin({ analyses_today: 100 }));

    render(<AdminDashboard />);

    expect(screen.getByText(/ceiling reached, nobody can analyse/)).toBeInTheDocument();
  });

  it('should ask for a different range when one is picked', () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole('button', { name: '7 days' }));

    expect(mockUseAdminStatsQuery).toHaveBeenLastCalledWith(7);
  });

  it('should mark the active range', () => {
    render(<AdminDashboard />);

    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should say plainly when a range has no failures', () => {
    mockUseAdminStatsQuery.mockReturnValue(asAdmin({ failures_by_reason: [] }));

    render(<AdminDashboard />);

    expect(screen.getByText('No failures in this range.')).toBeInTheDocument();
  });

  it('should not break on an empty range', () => {
    mockUseAdminStatsQuery.mockReturnValue(
      asAdmin({ daily: [], analyses: 0, avg_tokens: 0, measured: 0 }),
    );

    render(<AdminDashboard />);

    expect(screen.getByText('Nothing in this range.')).toBeInTheDocument();
  });
});
