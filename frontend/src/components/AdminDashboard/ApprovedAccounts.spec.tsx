import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ApprovedAccount } from '../../types';

const getApprovedAccounts = vi.fn<() => Promise<ApprovedAccount[]>>();

vi.mock('../../services/api', () => ({
  getApprovedAccounts: () => getApprovedAccounts(),
}));

vi.mock('../../context/authContext', () => ({
  useAuth: () => ({ session: { user: { id: 'admin' } } }),
}));

import { ApprovedAccounts } from './ApprovedAccounts';

const video = (n: number) => ({
  id: `v${n}`,
  titulo_video: `Video number ${n}`,
  url_original: `https://x.com/a/status/${n}`,
  created_at: '2026-10-17T12:00:00+00:00',
});

const renderList = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ApprovedAccounts />
    </QueryClientProvider>,
  );

describe('ApprovedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show each account approved lately with its latest videos', async () => {
    getApprovedAccounts.mockResolvedValue([
      {
        user_id: 'bia',
        display_name: 'Bia',
        created_at: '2026-10-15T12:00:00+00:00',
        approved_at: '2026-10-16T12:00:00+00:00',
        video_count: 7,
        videos: [1, 2, 3, 4, 5].map(video),
      },
    ]);
    renderList();

    expect(await screen.findByText('Bia')).toBeInTheDocument();
    expect(screen.getByText(/7 videos/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Video number 1' })).toHaveAttribute('href', 'https://x.com/a/status/1');
    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(screen.getByText('and 2 more')).toBeInTheDocument();
  });

  it('should say so when nobody was approved lately', async () => {
    getApprovedAccounts.mockResolvedValue([]);
    renderList();

    expect(await screen.findByText('No account was approved in the last 30 days.')).toBeInTheDocument();
  });
});
