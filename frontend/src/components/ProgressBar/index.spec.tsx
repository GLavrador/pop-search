import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressBar } from './index';

afterEach(() => vi.useRealTimers());

describe('ProgressBar', () => {
  it('advances while loading, completes and resets for the next request', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ProgressBar loading />);
    const filler = () => container.firstElementChild?.firstElementChild;

    expect(filler()).toHaveStyle({ width: '0%' });
    act(() => vi.advanceTimersByTime(50));
    expect(filler()).toHaveStyle({ width: '95%', transition: 'width 30s ease-out' });

    rerender(<ProgressBar loading={false} />);
    expect(filler()).toHaveStyle({ width: '100%', transition: 'width 0.5s ease-out' });

    rerender(<ProgressBar loading />);
    expect(filler()).toHaveStyle({ width: '0%', transition: 'width 0s ease-out' });
    act(() => vi.advanceTimersByTime(50));
    expect(filler()).toHaveStyle({ width: '95%' });
  });

  it('does not advance after a request finishes before the delay', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ProgressBar loading />);
    rerender(<ProgressBar loading={false} />);
    act(() => vi.advanceTimersByTime(50));
    expect(container.firstElementChild?.firstElementChild).toHaveStyle({ width: '100%' });
  });
});
