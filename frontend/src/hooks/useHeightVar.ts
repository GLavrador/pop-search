import { useLayoutEffect, type RefObject } from 'react';

const write = (node: HTMLElement | null, name: string) =>
  node?.parentElement?.style.setProperty(name, `${node.offsetHeight}px`);

/**
 * Keeps the height of a box in a CSS variable of its parent, so whatever shares
 * the parent with it can make room for it. Measured again on every render, and
 * whenever the box changes size by itself, as text wraps on a narrower screen.
 */
export const useHeightVar = (box: RefObject<HTMLElement | null>, name: string) => {
  useLayoutEffect(() => {
    write(box.current, name);
  });

  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(() => write(node, name));
    observer.observe(node);
    return () => observer.disconnect();
  }, [box, name]);
};
