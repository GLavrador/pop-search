import { useRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHeightVar } from './useHeightVar';

const Panel = ({ lines }: { lines: number }) => {
  const box = useRef<HTMLDivElement>(null);
  useHeightVar(box, '--over');
  return (
    <section data-testid="parent">
      <div ref={box} data-lines={lines} />
    </section>
  );
};

describe('keeping the height of a box where its neighbours can see it', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should write the height into the parent, and write it again when it changes', () => {
    // jsdom lays nothing out: each line is said to be 20px tall.
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset.lines ?? 0) * 20;
    });

    const { getByTestId, rerender } = render(<Panel lines={4} />);
    expect(getByTestId('parent').style.getPropertyValue('--over')).toBe('80px');

    rerender(<Panel lines={0} />);
    expect(getByTestId('parent').style.getPropertyValue('--over')).toBe('0px');
  });
});
