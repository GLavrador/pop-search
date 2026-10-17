import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, type HelpKey } from '../../context/robotContext';
import { useOwnerShown } from './owner';
import styles from './styles.module.css';

interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** What stands beside OK, if anything. */
  footer?: ReactNode;
  help?: HelpKey;
  /** Read to the end: no X and no Escape, only its button closes it. */
  required?: boolean;
  okLabel?: string;
}

// How much of the title bar always stays on screen, to be grabbed again.
const KEPT_IN_SIGHT = 60;
const TASKBAR = 30;

interface Grip {
  x: number;
  y: number;
  /** How far it may go each way before leaving the screen. */
  room: { left: number; right: number; up: number; down: number };
}

/** A small window over everything else: dragged by its title bar, closed by X, OK or Escape. */
export const Dialog = ({
  title,
  children,
  onClose,
  footer,
  help,
  required = false,
  okLabel,
}: DialogProps) => {
  const { t } = useI18n();
  const shown = useOwnerShown();
  const [moved, setMoved] = useState({ x: 0, y: 0 });
  const frame = useRef<HTMLDivElement>(null);
  const grip = useRef<Grip | null>(null);
  const titleId = useId();

  // The keyboard comes in with it, and goes back to where it was.
  useEffect(() => {
    const opener = document.activeElement;
    frame.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  // It goes when the window it belongs to does.
  useEffect(() => {
    if (!shown) onClose();
  }, [shown, onClose]);

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    const box = frame.current?.getBoundingClientRect();
    if (event.button !== 0 || !box || (event.target as Element).closest('button')) return;

    grip.current = {
      x: event.clientX - moved.x,
      y: event.clientY - moved.y,
      room: {
        left: moved.x - box.right + KEPT_IN_SIGHT,
        right: moved.x + window.innerWidth - box.left - KEPT_IN_SIGHT,
        up: moved.y - box.top,
        down: moved.y + window.innerHeight - TASKBAR - box.top - KEPT_IN_SIGHT / 2,
      },
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: PointerEvent) => {
    const held = grip.current;
    if (!held) return;

    setMoved({
      x: Math.min(held.room.right, Math.max(held.room.left, event.clientX - held.x)),
      y: Math.min(held.room.down, Math.max(held.room.up, event.clientY - held.y)),
    });
  };

  const handleUp = () => {
    grip.current = null;
  };

  return createPortal(
    <>
      {required && <div className={styles.backdrop} />}
      <div
        ref={frame}
        className={`win95-border ${styles.dialog}`}
        style={{ transform: `translate(calc(-50% + ${moved.x}px), ${moved.y}px)` }}
        role="dialog"
        aria-modal={required || undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !required) onClose();
        }}
        {...(help ? helpAt(help) : {})}
      >
        <div
          className={styles.titleBar}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          <span id={titleId} className={styles.title}>
            {title}
          </span>
          {!required && (
            <button
              type="button"
              className={styles.close}
              aria-label={t.common.closeOf(title)}
              onClick={onClose}
            >
              X
            </button>
          )}
        </div>

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          {footer}
          <button type="button" className={`win95-btn ${styles.ok}`} onClick={onClose}>
            {okLabel ?? t.common.ok}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};
