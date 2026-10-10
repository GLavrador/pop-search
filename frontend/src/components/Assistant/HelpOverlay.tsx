import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import styles from './styles.module.css';

interface HelpOverlayProps {
  /** The marked control under the click, or null when there was none. */
  onPick: (node: HTMLElement | null) => void;
  onCancel: () => void;
}

/**
 * Covers the screen while "what's this?" is armed, so the next click explains
 * the control under it instead of using it. Disabled controls answer too.
 */
export const HelpOverlay = ({ onPick, onCancel }: HelpOverlayProps) => {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const under = (x: number, y: number): HTMLElement | 'toggle' | 'balloon' | null => {
    for (const node of document.elementsFromPoint?.(x, y) ?? []) {
      if (node.closest('[data-help-layer]')) continue;
      // The balloon that announces the mode is not a thing to explain: its close button ends it.
      if (node.closest('[data-help-toggle], [data-robot-dismiss]')) return 'toggle';
      if (node.closest('[data-robot-says]')) return 'balloon';
      const marked = node.closest<HTMLElement>('[data-help]');
      if (marked) return marked;
    }
    return null;
  };

  const handleMove = (event: PointerEvent) => {
    const box = frame.current;
    if (!box) return;

    const hit = under(event.clientX, event.clientY);
    if (!hit || hit === 'toggle' || hit === 'balloon') {
      box.style.display = 'none';
      return;
    }
    const rect = hit.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = `${rect.left - 3}px`;
    box.style.top = `${rect.top - 3}px`;
    box.style.width = `${rect.width + 6}px`;
    box.style.height = `${rect.height + 6}px`;
  };

  const handleClick = (event: MouseEvent) => {
    const hit = under(event.clientX, event.clientY);
    if (hit === 'toggle') onCancel();
    else if (hit !== 'balloon') onPick(hit);
  };

  return (
    <div
      className={styles.helpLayer}
      data-help-layer
      onPointerMove={handleMove}
      onClick={handleClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div ref={frame} className={styles.helpFrame} />
    </div>
  );
};
