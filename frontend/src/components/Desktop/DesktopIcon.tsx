import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { helpAt } from '../../context/robotContext';
import type { Zone } from '../Assistant/pilot';
import styles from './styles.module.css';

export interface Spot {
  x: number;
  y: number;
}

interface DesktopIconProps {
  art: ReactNode;
  label: string;
  /** Lets the robot tell this icon apart when it is dropped on it. */
  zone: Zone;
  /** How much of it is there, from nothing (0) to an icon like any other (6). Its place is kept meanwhile. */
  built?: number;
  /** Being polished: it gleams. */
  shining?: boolean;
  /** Going down into whatever it was dropped on, from where it was let go. */
  swallowed?: boolean;
  /** Something that may be dropped here is being held over it. */
  aimedAt?: boolean;
  /** Drawn as selected. */
  pressed?: boolean;
  onOpen?: () => void;
  /** It is being carried, and this is where the pointer has it. */
  onCarry?: (at: Spot) => void;
  onDrop?: (at: Spot) => void;
}

const DRAG_AFTER = 5;
const WHOLE = 6;

// Touch has no double click, so a single tap opens there and double click opens
// on a mouse, which is what Windows itself does on each input.
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

const moved = (by: Spot, shrunk = false) =>
  `translate(${by.x}px, ${by.y}px)${shrunk ? ' scale(0.15)' : ''}`;

export const DesktopIcon = ({
  art,
  label,
  zone,
  built = WHOLE,
  shining = false,
  swallowed = false,
  aimedAt = false,
  pressed = false,
  onOpen,
  onCarry,
  onDrop,
}: DesktopIconProps) => {
  const press = useRef<{ x: number; y: number; carrying: boolean } | null>(null);
  const justDropped = useRef(false);
  const [carried, setCarried] = useState<Spot | null>(null);
  const [letGoAt, setLetGoAt] = useState<Spot | null>(null);

  const handleDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    press.current = { x: event.clientX, y: event.clientY, carrying: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: PointerEvent) => {
    const start = press.current;
    if (!start) return;

    const by = { x: event.clientX - start.x, y: event.clientY - start.y };
    if (!start.carrying && Math.hypot(by.x, by.y) < DRAG_AFTER) return;
    start.carrying = true;
    setCarried(by);
    onCarry?.({ x: event.clientX, y: event.clientY });
  };

  const handleUp = (event: PointerEvent) => {
    const carrying = press.current?.carrying ?? false;
    press.current = null;
    if (!carrying) return;

    // The click that ends a drag is not a click on the icon.
    justDropped.current = true;
    setTimeout(() => {
      justDropped.current = false;
    }, 0);
    setLetGoAt(carried);
    setCarried(null);
    onDrop?.({ x: event.clientX, y: event.clientY });
  };

  const sinking = swallowed && letGoAt !== null;

  return (
    <button
      type="button"
      className={styles.icon}
      style={
        carried
          ? { transform: moved(carried) }
          : sinking
            ? { transform: moved(letGoAt, true) }
            : undefined
      }
      data-robot="icon"
      data-robot-zone={zone}
      data-carried={carried ? '' : undefined}
      data-swallowed={sinking ? '' : undefined}
      data-built={built < WHOLE ? built : undefined}
      data-shining={shining ? '' : undefined}
      data-aimed={aimedAt ? '' : undefined}
      data-pressed={pressed ? '' : undefined}
      {...helpAt('desktop.icon')}
      onClick={() => {
        if (justDropped.current) return;
        if (isTouch()) onOpen?.();
      }}
      onDoubleClick={onOpen}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <span className={styles.art}>{art}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
};
