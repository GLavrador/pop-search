import { createRef } from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { Clutter, type ClutterHandle } from './Clutter';

// A disk 200 across and 200 down: room in line for two columns of two files, and no more.
const DISK = { left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0 } as DOMRect;
const FILES = 13;

const files = () => [...document.querySelectorAll('[data-junk="file"]')];
const putAway = () => files().filter((file) => file.hasAttribute('data-out'));

const renderClutter = (props: { tidy: boolean; held: boolean }, handle = createRef<ClutterHandle>()) => {
  const view = render(
    <LanguageProvider>
      <Clutter avoid={() => []} layout="earned" handle={handle} {...props} />
    </LanguageProvider>,
  );
  return {
    handle,
    again: (next: { tidy: boolean; held: boolean }) =>
      view.rerender(
        <LanguageProvider>
          <Clutter avoid={() => []} layout="earned" handle={handle} {...next} />
        </LanguageProvider>,
      ),
  };
};

describe('what lies on the disk, once it is put in order', () => {
  beforeEach(() => {
    localStorage.setItem('pop-search:language', 'en');
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(DISK);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(82);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(48);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should put away at once whatever the robot has no room in line for', () => {
    const { handle } = renderClutter({ tidy: false, held: true });

    const moves = handle.current?.order() ?? [];

    expect(moves).toHaveLength(4);
    expect(putAway()).toHaveLength(FILES - 4);
  });

  it('should leave nothing out of line once the robot is done, however small the screen', () => {
    const { again } = renderClutter({ tidy: false, held: true });

    again({ tidy: true, held: false });

    expect(putAway()).toHaveLength(FILES - 4);
    const placed = files()
      .filter((file) => !file.hasAttribute('data-out'))
      .map((file) => (file as HTMLElement).style.transform);
    expect(new Set(placed).size).toBe(4);
  });
});
