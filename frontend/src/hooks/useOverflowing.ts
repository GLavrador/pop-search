import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether what is in a box does not fit in the height it was given. Measured
 * again when the box changes size or `content` does, and only while `watching`:
 * a box let out to its full height has nothing left over to measure.
 */
export const useOverflowing = (
  box: RefObject<HTMLElement | null>,
  watching: boolean,
  content: unknown,
): boolean => {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node || !watching) return;

    const observer = new ResizeObserver(() => {
      setOverflowing(node.scrollHeight > node.clientHeight + 1);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [box, watching, content]);

  return overflowing;
};
