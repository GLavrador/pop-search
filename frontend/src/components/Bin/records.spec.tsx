import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSession = vi.fn();
const mockGetBinRecords = vi.fn();
const mockKeepBinRecords = vi.fn();

vi.mock('../../context/authContext', () => ({
  useAuth: () => ({ session: mockSession() }),
}));

vi.mock('../../services/api', () => ({
  getBinRecords: () => mockGetBinRecords(),
  keepBinRecords: (records: unknown) => mockKeepBinRecords(records),
}));

import { RECORDS_KEY, readRecords, useRecords } from './records';

const kept = () => JSON.parse(localStorage.getItem(RECORDS_KEY) ?? 'null');

const render = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRecords(), { wrapper });
};

const signedIn = () => mockSession.mockReturnValue({ user: { id: 'someone' } });

describe('the best scores at the games in the bin', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockSession.mockReturnValue(null);
    mockKeepBinRecords.mockImplementation(async (records) => records);
  });

  it('should start with none', () => {
    expect(readRecords()).toEqual({ flappy: 0, dino: 0 });
  });

  it('should keep a score that beats the last one in the browser, and say that it did', () => {
    const { result } = render();

    let fresh = false;
    act(() => {
      fresh = result.current.score('flappy', 12);
    });

    expect(fresh).toBe(true);
    expect(result.current.records).toEqual({ flappy: 12, dino: 0 });
    expect(kept()).toEqual({ flappy: 12, dino: 0 });
    expect(mockKeepBinRecords).not.toHaveBeenCalled();
  });

  it('should leave the record alone when the score does not beat it', () => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify({ flappy: 12, dino: 300 }));
    const { result } = render();

    let fresh = true;
    act(() => {
      fresh = result.current.score('dino', 300);
    });

    expect(fresh).toBe(false);
    expect(result.current.records).toEqual({ flappy: 12, dino: 300 });
  });

  it('should find the records again on the next visit', () => {
    const first = render();
    act(() => {
      first.result.current.score('dino', 412);
    });
    first.unmount();

    const { result } = render();

    expect(result.current.records.dino).toBe(412);
  });

  it.each([
    ['not JSON at all', 'oops'],
    ['something else under the name', '"high"'],
    ['scores that are no scores', JSON.stringify({ flappy: 'a lot', dino: -5 })],
  ])('should have no record when what was kept is %s', (_, stored) => {
    localStorage.setItem(RECORDS_KEY, stored);

    expect(readRecords()).toEqual({ flappy: 0, dino: 0 });
  });

  describe('signed in', () => {
    beforeEach(signedIn);

    it('should show the records kept in the account', async () => {
      mockGetBinRecords.mockResolvedValue({ flappy: 30, dino: 900 });

      const { result } = render();

      await waitFor(() => expect(result.current.records).toEqual({ flappy: 30, dino: 900 }));
      expect(mockKeepBinRecords).not.toHaveBeenCalled();
    });

    it('should take into the account the better records this browser had, game by game', async () => {
      localStorage.setItem(RECORDS_KEY, JSON.stringify({ flappy: 40, dino: 100 }));
      mockGetBinRecords.mockResolvedValue({ flappy: 30, dino: 900 });

      const { result } = render();

      await waitFor(() => expect(result.current.records).toEqual({ flappy: 40, dino: 900 }));
      expect(mockKeepBinRecords).toHaveBeenCalledWith({ flappy: 40, dino: 900 });
    });

    it('should keep a new record in the account, not in the browser', async () => {
      mockGetBinRecords.mockResolvedValue({ flappy: 30, dino: 900 });
      const { result } = render();
      await waitFor(() => expect(result.current.records.flappy).toBe(30));

      let fresh = false;
      act(() => {
        fresh = result.current.score('flappy', 31);
      });

      expect(fresh).toBe(true);
      await waitFor(() => expect(result.current.records).toEqual({ flappy: 31, dino: 900 }));
      expect(mockKeepBinRecords).toHaveBeenCalledWith({ flappy: 31, dino: 900 });
      expect(kept()).toBeNull();
    });

    it('should judge a score against the record of the account, not the one of the browser', async () => {
      mockGetBinRecords.mockResolvedValue({ flappy: 30, dino: 0 });
      const { result } = render();
      await waitFor(() => expect(result.current.records.flappy).toBe(30));

      let fresh = true;
      act(() => {
        fresh = result.current.score('flappy', 20);
      });

      expect(fresh).toBe(false);
    });

    it('should keep a record in the browser when the account cannot take it', async () => {
      mockGetBinRecords.mockRejectedValue(new Error('down'));
      mockKeepBinRecords.mockRejectedValue(new Error('down'));
      const { result } = render();

      act(() => {
        result.current.score('dino', 77);
      });

      await waitFor(() => expect(kept()).toEqual({ flappy: 0, dino: 77 }));
      expect(result.current.records.dino).toBe(77);
    });
  });
});
