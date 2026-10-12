import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const pingServer = vi.fn();

vi.mock('../services/api', () => ({
  pingServer: (...args: unknown[]) => pingServer(...args),
}));

import { useServerWake } from './useServerWake';

const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('useServerWake', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pingServer.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should report the server awake, with how long the answer took', async () => {
    pingServer.mockReturnValue(new Promise<void>((answer) => setTimeout(answer, 700)));

    const { result } = renderHook(() => useServerWake());
    expect(result.current).toEqual({ state: 'waking', tookMs: null });

    await pass(700);

    expect(result.current).toEqual({ state: 'awake', tookMs: 700 });
  });

  it('should knock again after a knock that failed', async () => {
    pingServer.mockRejectedValueOnce(new Error('asleep')).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useServerWake());
    await pass(0);
    expect(result.current.state).toBe('waking');

    await pass(2000);

    expect(pingServer).toHaveBeenCalledTimes(2);
    expect(result.current.state).toBe('awake');
  });

  it('should give up on a server that stays silent for two minutes', async () => {
    pingServer.mockRejectedValue(new Error('gone'));

    const { result } = renderHook(() => useServerWake());
    await pass(120000);

    expect(result.current).toEqual({ state: 'down', tookMs: null });

    const knocks = pingServer.mock.calls.length;
    await pass(10000);
    expect(pingServer).toHaveBeenCalledTimes(knocks);
  });

  it('should stop knocking once the page is gone', async () => {
    pingServer.mockRejectedValue(new Error('asleep'));

    const { unmount } = renderHook(() => useServerWake());
    await pass(2000);
    const knocks = pingServer.mock.calls.length;

    unmount();
    await pass(10000);

    expect(pingServer).toHaveBeenCalledTimes(knocks);
    expect(pingServer.mock.calls[0][0].aborted).toBe(true);
  });
});
