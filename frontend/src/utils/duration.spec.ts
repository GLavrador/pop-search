import { describe, it, expect } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('should not call a step that took almost nothing zero', () => {
    expect(formatDuration(0, 'en-US')).toBe('<1 ms');
    expect(formatDuration(0.4, 'en-US')).toBe('<1 ms');
  });

  it('should give whole milliseconds under a second', () => {
    expect(formatDuration(1, 'en-US')).toBe('1 ms');
    expect(formatDuration(412.6, 'en-US')).toBe('413 ms');
    expect(formatDuration(999.4, 'en-US')).toBe('999 ms');
  });

  it('should give seconds to one decimal, written the way the language writes them', () => {
    expect(formatDuration(1240, 'en-US')).toBe('1.2 s');
    expect(formatDuration(1240, 'pt-BR')).toBe('1,2 s');
    expect(formatDuration(34000, 'en-US')).toBe('34 s');
  });

  it('should give minutes and then hours for what stays on for long', () => {
    expect(formatDuration(13 * 60 * 1000, 'en-US')).toBe('13 min');
    expect(formatDuration(5 * 60 * 60 * 1000, 'en-US')).toBe('5 h');
  });
});
