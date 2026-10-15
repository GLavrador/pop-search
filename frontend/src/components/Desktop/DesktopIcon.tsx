import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { helpAt } from '../../context/robotContext';
import type { Zone } from '../Assistant/pilot';
import styles from './styles.module.css';

export interface Spot {
  x: number;
  y: number;
}

/** How far something else has taken an icon from its place, and how long the move takes. */
export interface Borne extends Spot {
  ms: number;
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
  /** In the bin. Its place stays empty until it is fetched back. */
  trashed?: boolean;
  /** Something that may be dropped here is being held over it. */
  aimedAt?: boolean;
  /** Drawn as selected. */
  pressed?: boolean;
  /** Carried off by something other than the pointer. */
  borne?: Borne | null;
  /** Thrown in the bin from afar: it flies there, and then it is in. */
  tossed?: boolean;
  onTossed?: () => void;
  onOpen?: () => void;
  /** It is being carried, and this is where the pointer has it. */
  onCarry?: (at: Spot) => void;
  onDrop?: (at: Spot) => void;
}

const DRAG_AFTER = 5;
const WHOLE = 6;
const BACK_MS = 700;
const TOSS_MS = 900;
const ARC = 46;

// Touch has no double click, so a single tap opens there and double click opens
// on a mouse, which is what Windows itself does on each input.
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

const moved = (by: Spot, shrunk = false) =>
  `translate(${by.x}px, ${by.y}px)${shrunk ? ' scale(0.15)' : ''}`;

const centreOf = (box: DOMRect): Spot => ({
  x: box.left + box.width / 2,
  y: box.top + box.height / 2,
});

// Where it stands when nothing has moved it: its box on screen follows it around.
const placeOf = (node: HTMLElement): Spot | null => {
  const within = node.offsetParent?.getBoundingClientRect();
  return within
    ? {
        x: within.left + node.offsetLeft + node.offsetWidth / 2,
        y: within.top + node.offsetTop + node.offsetHeight / 2,
      }
    : null;
};

/** Out of the bin in an arc, turning over, to land where it belongs. */
const comeBack = (node: HTMLElement) => {
  const bin = document.querySelector('[data-robot="icon"][data-robot-zone="bin"]');
  const place = placeOf(node);
  if (!bin || !place || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const mouth = centreOf(bin.getBoundingClientRect());
  const from = { x: mouth.x - place.x, y: mouth.y - place.y };
  const top = { x: from.x * 0.45, y: Math.min(from.y, 0) * 0.45 - 46 };
  node.animate?.(
    [
      { transform: `${moved(from)} scale(0.2) rotate(-220deg)`, opacity: 0, easing: 'ease-out' },
      { opacity: 1, offset: 0.14 },
      { transform: `${moved(top)} scale(0.9) rotate(-70deg)`, offset: 0.5, easing: 'ease-in' },
      { transform: 'translate(0, 0) scale(1.14) rotate(0deg)', offset: 0.84 },
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
    ],
    { duration: BACK_MS },
  );
};

/** Into the bin in an arc, turning over, the way it comes back out. It stays there, unseen, until it is in. */
const toss = (node: HTMLElement, done: () => void) => {
  const bin = document.querySelector('[data-robot="icon"][data-robot-zone="bin"]');
  const place = placeOf(node);
  if (!bin || !place || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done();
    return null;
  }

  const mouth = centreOf(bin.getBoundingClientRect());
  const to = { x: mouth.x - place.x, y: mouth.y - place.y };
  const half = { x: to.x * 0.55, y: to.y * 0.55 };
  // Up and over, swinging out when the bin is straight above. Without room above, it dips instead.
  const top =
    place.y + half.y - ARC > 8
      ? { x: half.x + (Math.abs(to.x) < ARC ? ARC : 0), y: half.y - ARC }
      : { x: half.x, y: half.y + ARC };
  const flight = node.animate?.(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', easing: 'ease-out' },
      { transform: `${moved(top)} scale(0.9) rotate(150deg)`, offset: 0.5, easing: 'ease-in' },
      { transform: `${moved(to)} scale(0.2) rotate(300deg)`, opacity: 1, offset: 0.88 },
      { transform: `${moved(to)} scale(0.2) rotate(300deg)`, opacity: 0 },
    ],
    { duration: TOSS_MS, fill: 'forwards' },
  );
  if (!flight) {
    done();
    return null;
  }
  flight.finished.then(done, () => {});
  return flight;
};

export const DesktopIcon = ({
  art,
  label,
  zone,
  built = WHOLE,
  shining = false,
  swallowed = false,
  trashed = false,
  aimedAt = false,
  pressed = false,
  borne = null,
  tossed = false,
  onTossed,
  onOpen,
  onCarry,
  onDrop,
}: DesktopIconProps) => {
  const node = useRef<HTMLButtonElement>(null);
  const press = useRef<{ x: number; y: number; carrying: boolean } | null>(null);
  const justDropped = useRef(false);
  const wasTrashed = useRef(trashed);
  const flight = useRef<Animation | null>(null);
  const landed = useRef(onTossed);
  const [carried, setCarried] = useState<Spot | null>(null);
  const [letGoAt, setLetGoAt] = useState<Spot | null>(null);

  useLayoutEffect(() => {
    landed.current = onTossed;
  });

  useLayoutEffect(() => {
    const fetched = wasTrashed.current && !trashed;
    wasTrashed.current = trashed;
    if (fetched && node.current) comeBack(node.current);
    // In the bin, out of sight: what kept it at the end of its flight lets go.
    if (trashed) {
      flight.current?.cancel();
      flight.current = null;
    }
  }, [trashed]);

  useLayoutEffect(() => {
    if (!tossed || !node.current) return;
    flight.current = toss(node.current, () => landed.current?.());
  }, [tossed]);

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

  const sinking = (swallowed || trashed) && letGoAt !== null;

  return (
    <button
      ref={node}
      type="button"
      className={styles.icon}
      style={
        carried
          ? { transform: moved(carried) }
          : sinking
            ? { transform: moved(letGoAt, true) }
            : borne
              ? { transform: moved(borne), transition: `transform ${borne.ms}ms ease-in-out` }
              : undefined
      }
      // In the bin it is nowhere to be found: not by the robot, not by the keyboard.
      data-robot={trashed ? undefined : 'icon'}
      data-robot-zone={trashed ? undefined : zone}
      data-slot={zone}
      data-carried={carried ? '' : undefined}
      data-swallowed={sinking ? '' : undefined}
      data-trashed={trashed ? '' : undefined}
      data-built={built < WHOLE ? built : undefined}
      data-shining={shining ? '' : undefined}
      data-aimed={aimedAt ? '' : undefined}
      data-pressed={pressed ? '' : undefined}
      inert={trashed}
      aria-hidden={trashed || undefined}
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
