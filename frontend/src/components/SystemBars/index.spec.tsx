import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SystemBars } from './index';
import { BARS, useBarColors, type Bars } from './bars';

const Screen = ({ bars }: { bars: Bars | null }) => {
  useBarColors(bars);
  return null;
};

const edges = () => [...document.querySelectorAll<HTMLElement>('i[aria-hidden="true"]')];
const colours = () => edges().map((edge) => edge.style.backgroundColor);
const themeColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

describe('the colours of the phone bars', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('should have the desktop colours when no screen has them', () => {
    render(<SystemBars />);

    expect(colours()).toEqual(['rgb(0, 128, 128)', 'rgb(192, 192, 192)']);
    expect(themeColor()).toBe(BARS.desktop.top);
  });

  it('should follow the screen on view, and give them back once it is gone', () => {
    const view = render(
      <>
        <SystemBars />
        <Screen bars={BARS.bin} />
      </>,
    );
    expect(colours()).toEqual(['rgb(0, 0, 128)', 'rgb(192, 192, 192)']);
    expect(themeColor()).toBe(BARS.bin.top);

    view.rerender(
      <>
        <SystemBars />
        <Screen bars={null} />
      </>,
    );

    expect(colours()).toEqual(['rgb(0, 128, 128)', 'rgb(192, 192, 192)']);
    expect(themeColor()).toBe(BARS.desktop.top);
  });

  it('should put the strips down anew on every change, for the browser to look at them again', () => {
    const view = render(
      <>
        <SystemBars />
        <Screen bars={BARS.blue} />
      </>,
    );
    const before = edges();

    view.rerender(
      <>
        <SystemBars />
        <Screen bars={null} />
      </>,
    );

    const after = edges();
    expect(after).toHaveLength(2);
    after.forEach((edge) => expect(before).not.toContain(edge));
  });
});
