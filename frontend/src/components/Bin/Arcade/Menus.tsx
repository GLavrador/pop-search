import type { ReactNode } from 'react';
import type { Rect } from './play';
import styles from './styles.module.css';

// Every line of a menu is this tall, separators included.
const ROW = 9;

const at = (x: number, y: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

type StartItem =
  | 'update'
  | 'programs'
  | 'favorites'
  | 'documents'
  | 'settings'
  | 'find'
  | 'help'
  | 'run'
  | 'logoff'
  | 'shutdown'
  | '-';

// The Start menu of Windows 98, top to bottom. It is read from the bottom up, from Shut Down.
const START: readonly StartItem[] = [
  'update',
  '-',
  'programs',
  'favorites',
  'documents',
  'settings',
  'find',
  'help',
  'run',
  '-',
  'logoff',
  'shutdown',
];

// The ones that open another menu, with the arrow that says so.
const MORE = new Set<StartItem>(['programs', 'favorites', 'documents', 'settings', 'find']);

// Each item's picture, at seven pixels a side.
const PICTURES: Record<Exclude<StartItem, '-'>, ReactNode> = {
  update: (
    <>
      <circle cx="3.5" cy="3.5" r="3" fill="#1084d0" stroke="#003070" strokeWidth="0.4" />
      <path d="M0.8 3.5h5.4M3.5 0.6v5.8" stroke="#9fe0ff" strokeWidth="0.5" />
    </>
  ),
  programs: (
    <>
      <path d="M0.5 1.4h2.4l0.7 0.8h2.9v4.3h-6z" fill="#e8c040" stroke="#7a5a00" strokeWidth="0.4" />
      <rect x="2.4" y="3.2" width="2.2" height="1.8" fill="#000080" />
    </>
  ),
  favorites: (
    <path
      d="M3.5 0.5l0.9 2h2.1l-1.7 1.3 0.7 2.2-2-1.3-2 1.3 0.7-2.2-1.7-1.3h2.1z"
      fill="#f0c000"
      stroke="#806000"
      strokeWidth="0.3"
    />
  ),
  documents: (
    <>
      <path d="M1.2 0.5h3.3l1.3 1.3v4.7h-4.6z" fill="#fff" stroke="#404040" strokeWidth="0.4" />
      <path d="M2 3h3M2 4.3h3" stroke="#000080" strokeWidth="0.5" />
    </>
  ),
  settings: (
    <>
      <rect x="0.5" y="1" width="6" height="5" fill="#c0c0c0" stroke="#404040" strokeWidth="0.4" />
      <rect x="1.3" y="2" width="1.7" height="1.7" fill="#d02020" />
      <rect x="3.9" y="2" width="1.7" height="1.7" fill="#20a020" />
      <rect x="1.3" y="4.2" width="4.3" height="0.9" fill="#000080" />
    </>
  ),
  find: (
    <>
      <circle cx="2.8" cy="2.8" r="1.9" fill="#bfe6ff" stroke="#202020" strokeWidth="0.5" />
      <path d="M4.1 4.1l2.3 2.3" stroke="#804000" strokeWidth="1" />
    </>
  ),
  help: (
    <>
      <rect x="1" y="0.7" width="5" height="5.6" fill="#1a6ad0" stroke="#002060" strokeWidth="0.4" />
      <path d="M2.6 2.5q0.9-1.2 1.8 0q0.2 0.8-0.9 1.3v0.7" stroke="#fff" strokeWidth="0.5" fill="none" />
    </>
  ),
  run: (
    <>
      <rect x="0.5" y="1" width="6" height="5" fill="#fff" stroke="#404040" strokeWidth="0.4" />
      <rect x="0.5" y="1" width="6" height="1.4" fill="#000080" />
    </>
  ),
  logoff: (
    <>
      <circle cx="2.2" cy="3.5" r="1.5" fill="#e8c040" stroke="#7a5a00" strokeWidth="0.4" />
      <path d="M3.6 3.5h2.9M5.6 3.5v1.3" stroke="#7a5a00" strokeWidth="0.6" />
    </>
  ),
  shutdown: (
    <>
      <rect x="0.8" y="0.8" width="5.4" height="4" fill="#0a246a" stroke="#404040" strokeWidth="0.5" />
      <rect x="2.3" y="5" width="2.4" height="1.3" fill="#808080" />
    </>
  ),
};

/** How many lines fit in a menu this tall, with what is left of its edges. */
const fitting = (h: number) => Math.max(0, Math.floor((h - 4) / ROW));

interface MenuProps {
  box: Rect;
  /** Which of a few looks it has, so that not every menu is the same. */
  look: number;
}

/**
 * A menu dropped from the menu bar: its items one under the other, and the
 * last of them, over the way through, under the pointer.
 */
export const DropMenu = ({ box, look, items }: MenuProps & { items: readonly string[] }) => {
  const count = fitting(box.h);
  const rows = Array.from({ length: count }, (_, i) => items[(i + look * 3) % items.length]);
  if (rows[count - 1] === '-') rows[count - 1] = items[(count + look * 3) % items.length];

  return (
    <div
      className={styles.dropMenu}
      style={{ transform: at(box.x, box.y), width: box.w, height: box.h }}
    >
      {rows.map((label, index) =>
        label === '-' ? (
          <i key={index} className={styles.rule} />
        ) : (
          <span key={index} data-on={index === count - 1 ? '' : undefined}>
            {label}
          </span>
        ),
      )}
    </div>
  );
};

/**
 * A Start menu up from the taskbar: the banner down its side, and its items
 * from Shut Down upwards, as many as fit. The top one, at the way through, is
 * the one the pointer is on.
 */
export const StartMenu = ({ box, look }: MenuProps) => {
  const count = fitting(box.h);
  const rows = Array.from(
    { length: count },
    (_, i) => START[(((START.length - count + i) % START.length) + START.length) % START.length],
  );
  const lit = rows.findIndex((item) => item !== '-');

  return (
    <div
      className={styles.startMenu}
      style={{ transform: at(box.x, box.y), width: box.w, height: box.h }}
      data-look={look}
    >
      <span className={styles.banner}>
        Windows<b>98</b>
      </span>
      {rows.map((item, index) =>
        item === '-' ? (
          <i key={index} className={styles.rule} />
        ) : (
          <span
            key={index}
            data-on={index === lit ? '' : undefined}
            data-more={MORE.has(item) ? '' : undefined}
          >
            <svg viewBox="0 0 7 7" aria-hidden="true">
              {PICTURES[item]}
            </svg>
            <i style={{ width: `${34 + ((index * 23 + look * 11) % 30)}%` }} />
          </span>
        ),
      )}
    </div>
  );
};
