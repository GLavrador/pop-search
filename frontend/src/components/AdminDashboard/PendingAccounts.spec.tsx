import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PendingAccount } from '../../types';

const getPendingAccounts = vi.fn<() => Promise<PendingAccount[]>>();
const approveAccount = vi.fn<(id: string) => Promise<void>>();
const removePendingVideo = vi.fn<(id: string) => Promise<void>>();

vi.mock('../../services/api', () => ({
  getPendingAccounts: () => getPendingAccounts(),
  approveAccount: (id: string) => approveAccount(id),
  removePendingVideo: (id: string) => removePendingVideo(id),
}));

vi.mock('../../context/authContext', () => ({
  useAuth: () => ({ session: { user: { id: 'admin' } } }),
}));

const setStatus = vi.fn();
vi.mock('../../context/status', () => ({
  useStatus: () => ({ setStatus }),
}));

import { PendingAccounts } from './PendingAccounts';

const BIA: PendingAccount = {
  user_id: 'bia',
  display_name: 'Bia',
  created_at: '2026-10-16T12:00:00+00:00',
  video: {
    id: 'video-1',
    titulo_video: 'A cat jumps into a box',
    descricao_completa: 'A grey cat jumps into a box that is far too small.',
    url_original: 'https://x.com/a/status/1',
    created_at: '2026-10-16T12:30:00+00:00',
    post: { texto: 'look at him', miniatura: null },
  },
};

const CAIO: PendingAccount = {
  user_id: 'caio',
  display_name: 'Caio',
  created_at: '2026-10-17T09:00:00+00:00',
  video: null,
};

const renderList = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PendingAccounts />
    </QueryClientProvider>,
  );

describe('PendingAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPendingAccounts.mockResolvedValue([BIA, CAIO]);
    approveAccount.mockResolvedValue();
    removePendingVideo.mockResolvedValue();
  });

  it('should show each account with what its video shows', async () => {
    renderList();

    expect(await screen.findByText('Bia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A cat jumps into a box' })).toHaveAttribute(
      'href',
      'https://x.com/a/status/1',
    );
    expect(screen.getByText(/far too small/)).toBeInTheDocument();
    expect(screen.getByText('"look at him"')).toBeInTheDocument();
    expect(screen.getByText('No video yet.')).toBeInTheDocument();
    expect(screen.getByText('Accounts waiting for approval (2)')).toBeInTheDocument();
  });

  it('should say so when nobody is waiting', async () => {
    getPendingAccounts.mockResolvedValue([]);
    renderList();

    expect(await screen.findByText('No account is waiting.')).toBeInTheDocument();
  });

  it('should approve an account and ask for the list again', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Approve Bia' }));

    expect(approveAccount).toHaveBeenCalledWith('bia');
    await waitFor(() => expect(getPendingAccounts).toHaveBeenCalledTimes(2));
    expect(setStatus).toHaveBeenCalledWith("Bia's account approved. The video is now public.", 5000);
  });

  it('should only delete a video once asked twice', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Delete the video of Bia' }));
    expect(removePendingVideo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(removePendingVideo).toHaveBeenCalledWith('bia');
  });

  it('should not speak of a video when the account approved had none', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Approve Caio' }));

    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("Caio's account approved.", 5000));
  });

  it('should offer no video to delete for an account that sent none', async () => {
    renderList();

    await screen.findByText('Caio');

    expect(screen.queryByRole('button', { name: 'Delete the video of Caio' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve Caio' })).toBeInTheDocument();
  });

  it('should say so when an approval fails, and keep the account listed', async () => {
    approveAccount.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Approve Bia' }));

    await waitFor(() => expect(setStatus).toHaveBeenCalledWith('That did not work. Try again.', 5000));
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });
});
