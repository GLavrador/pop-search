import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RECORDS_KEY, readRecords, useRecords } from './records';

describe('the best scores at the games in the bin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with none', () => {
    expect(readRecords()).toEqual({ flappy: 0, dino: 0 });
  });

  it('should keep a score that beats the last one, and say that it did', () => {
    const { result } = renderHook(() => useRecords());

    let fresh = false;
    act(() => {
      fresh = result.current.score('flappy', 12);
    });

    expect(fresh).toBe(true);
    expect(result.current.records).toEqual({ flappy: 12, dino: 0 });
    expect(JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '{}')).toEqual({ flappy: 12, dino: 0 });
  });

  it('should leave the record alone when the score does not beat it', () => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify({ flappy: 12, dino: 300 }));
    const { result } = renderHook(() => useRecords());

    let fresh = true;
    act(() => {
      fresh = result.current.score('dino', 300);
    });

    expect(fresh).toBe(false);
    expect(result.current.records).toEqual({ flappy: 12, dino: 300 });
  });

  it('should find the records again on the next visit', () => {
    const first = renderHook(() => useRecords());
    act(() => {
      first.result.current.score('dino', 412);
    });
    first.unmount();

    const { result } = renderHook(() => useRecords());

    expect(result.current.records.dino).toBe(412);
  });

  it.each([
    ['not JSON at all', 'oops'],
    ['something else under the name', '"high"'],
    ['scores that are no scores', JSON.stringify({ flappy: 'a lot', dino: -5 })],
  ])('should have no record when what was kept is %s', (_, kept) => {
    localStorage.setItem(RECORDS_KEY, kept);

    expect(readRecords()).toEqual({ flappy: 0, dino: 0 });
  });
});
