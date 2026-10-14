import type { ReactNode } from 'react';
import { Puppet } from '../../Assistant/Puppet';
import { DINO, SHAPES, boxOf, onGround, type DinoState, type Kind } from './dino';
import type { ViewProps } from './index';
import styles from './styles.module.css';

const { bot, floor } = DINO;

const at = (x: number, y: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

const Floppy = ({ x = 0, tilt = 0 }: { x?: number; tilt?: number }) => (
  <g transform={`translate(${x} 0) rotate(${tilt} 9 20)`}>
    <path d="M0.5 0.5 H14.5 L17.5 3.5 V19.5 H0.5 Z" fill="#22226b" />
    <rect x="4" y="0.5" width="9" height="6" fill="#c0c0c0" />
    <rect x="9.5" y="1.5" width="2.5" height="4" fill="#22226b" stroke="none" />
    <rect x="3" y="10.5" width="12" height="9" fill="#ffffff" />
    <path d="M5 13.5 H13 M5 16.5 H11" stroke="#808080" strokeWidth="1" />
  </g>
);

/** What lies in the way, or flies at it. Each is drawn to the size the game takes it to be. */
const ART: Record<Kind, ReactNode> = {
  floppy: <Floppy />,
  floppies: (
    <>
      <Floppy x={14} tilt={14} />
      <Floppy x={1} tilt={-6} />
    </>
  ),
  hourglass: (
    <>
      <path d="M1.5 0.5 H14.5 V4 H1.5 Z M1.5 24 H14.5 V27.5 H1.5 Z" fill="#c0c0c0" />
      <path d="M3 4 H13 L12 10 L8.6 14 L12 18 L13 24 H3 L4 18 L7.4 14 L4 10 Z" fill="#ffffff" />
      <path d="M5 6 H11 L8 12 Z M4.6 23 L8 17.5 L11.4 23 Z" fill="#d8a520" stroke="none" />
    </>
  ),
  error: (
    <>
      <rect x="0.5" y="0.5" width="43" height="18" fill="#c0c0c0" />
      <rect x="2" y="2" width="40" height="5" fill="#000080" stroke="none" />
      <rect x="37.5" y="2.8" width="3.6" height="3.4" fill="#c0c0c0" stroke="none" />
      <circle cx="8" cy="12.5" r="3.6" fill="#e03020" />
      <path d="M6.3 10.8 L9.7 14.2 M9.7 10.8 L6.3 14.2" stroke="#ffffff" strokeWidth="1.2" />
      <path d="M15 11 H39 M15 14.5 H32" stroke="#404040" strokeWidth="1" />
    </>
  ),
  monitor: (
    <>
      <rect x="0.5" y="0.5" width="29" height="22" fill="#d6d2c4" />
      <rect x="3.5" y="3.5" width="23" height="15" fill="#0a1a1a" />
      <path d="M6 7 H16 M6 10 H21 M6 13 H12" stroke="#33ff99" strokeWidth="1" />
      <rect x="10.5" y="22.5" width="9" height="3" fill="#b4b0a2" />
      <rect x="5.5" y="25.5" width="19" height="4" fill="#d6d2c4" />
    </>
  ),
  window: (
    <>
      <path d="M-13 4 H-8 V9 H-13 Z M-7 11 H-3 V15 H-7 Z M-17 13 H-13 V17 H-17 Z" fill="#8a8a9a" stroke="none" />
      <rect x="0.5" y="0.5" width="27" height="19" fill="#c0c0c0" />
      <rect x="2" y="2" width="24" height="4.5" fill="#000080" stroke="none" />
      <rect x="2.5" y="8" width="23" height="9.5" fill="#ffffff" />
      <path d="M2.5 8 H25.5 V17.5" fill="none" stroke="#808080" strokeWidth="1" />
    </>
  ),
};

/** A night of stars going by, like the screen saver, and a floor to run along. */
export const DinoView = ({ state, calm, glad }: ViewProps<DinoState>) => {
  const drift = calm ? 0 : state.dist;
  const grounded = onGround(state);
  const pose = state.over
    ? 'dangle'
    : !grounded
      ? state.vy < 0
        ? 'fly'
        : 'hover'
      : state.ducking
        ? 'duck'
        : state.started
          ? 'run'
          : 'stand';

  return (
    <div className={styles.night}>
      <div className={styles.stars} style={{ backgroundPositionX: `${(-drift * 0.06).toFixed(1)}px` }} />
      <div
        className={styles.starsNear}
        style={{ backgroundPositionX: `${(-drift * 0.16).toFixed(1)}px` }}
      />
      <div className={styles.flock} style={{ backgroundPositionX: `${(-drift * 0.3).toFixed(1)}px` }} />
      <div className={styles.disc} />

      <div
        className={styles.ground}
        style={{ top: floor, backgroundPositionX: `${(-drift).toFixed(1)}px` }}
      />

      {state.hazards.map((hazard) => {
        const box = boxOf(hazard);
        const { w, h } = SHAPES[hazard.kind];
        return (
          <svg
            key={hazard.id}
            className={styles.hazard}
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            style={{ transform: at(box.x, box.y) }}
            data-kind={hazard.kind}
            aria-hidden="true"
          >
            {ART[hazard.kind]}
          </svg>
        );
      })}

      <div className={styles.runner} style={{ transform: at(bot.x, state.y) }}>
        <Puppet pose={pose} face={state.over ? 'dizzy' : glad ? 'happy' : 'brave'} />
      </div>
    </div>
  );
};
