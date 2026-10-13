import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { isAnyKey } from '../../utils/keys';
import { Robot } from '../Assistant/Robot';
import { emoteSpot } from './emoteSpot';
import type { Cast, Kind } from './stage';
import styles from './styles.module.css';

interface RebuildProps {
  cast: Cast;
  kind: Kind;
  onSkip: () => void;
}

const ROBOT_W = 46;
const BALLOON_W = 280;
const EDGE = 12;
// Higher than this there is no room over its head: what it says hangs under it.
const HEADROOM = 150;

/** The robot of the show and what it holds, over everything else on the screen. */
export const Rebuild = ({ cast, kind, onSkip }: RebuildProps) => {
  const { t } = useI18n();
  const actor = useSyncExternalStore(cast.subscribe, cast.get);
  // Nobody asked for the building that opens the page, so anything gets rid of it.
  const anything = kind === 'setup';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (anything ? isAnyKey(event) : event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anything, onSkip]);

  // The balloon is centred on it, then pushed back in from whichever edge it crosses.
  const screen = window.innerWidth;
  const width = Math.min(BALLOON_W, screen - 2 * EDGE);
  const wanted = (actor?.x ?? 0) + ROBOT_W / 2 - width / 2;
  const shift = Math.min(Math.max(wanted, EDGE), screen - EDGE - width) - wanted;
  const facing = actor?.flip ? -1 : 1;
  const mutter = emoteSpot(actor?.x ?? 0, actor?.y ?? 0, screen);

  return (
    <div className={styles.scene} data-rebuild onClick={anything ? onSkip : undefined}>
      {actor && (
        <div
          className={styles.actor}
          style={
            {
              transform: `translate3d(${actor.x}px, ${actor.y}px, 0)`,
              transitionDuration: `${actor.ms}ms`,
              transitionTimingFunction: actor.ease,
              '--lean': `${actor.lean * facing}deg`,
              '--look-x': `${actor.gaze * facing * 2.2}px`,
            } as CSSProperties
          }
          data-pose={actor.pose}
          data-face={actor.face}
          data-talking={actor.talking ? '' : undefined}
        >
          <span className={styles.body} data-flip={actor.flip ? '' : undefined}>
            <Robot />
            {actor.tool === 'hammer' && (
              <span className={styles.swing} aria-hidden="true">
                <svg viewBox="0 0 22 14" className={styles.hammer}>
                  <rect className={styles.handle} x="0.5" y="5.7" width="15" height="2.6" />
                  <rect x="15" y="0.7" width="6.3" height="12.6" />
                  <path className={styles.sparks} d="M18 15 l-4.5 4 M18.2 15.5 v6 M18.4 15 l4.5 4" />
                </svg>
              </span>
            )}
            {actor.tool === 'duster' && (
              <span className={styles.sweep} aria-hidden="true">
                <svg viewBox="0 0 32 18" className={styles.duster}>
                  <rect className={styles.handle} x="0.5" y="7.6" width="15" height="2.8" />
                  <path
                    className={styles.feathers}
                    d="M14 9 C14 4 18 1.5 21 3.5 C23 0.5 28 1 28.5 5 C32 5.5 32 12.5 28.5 13 C28 17 23 17.5 21 14.5 C18 16.5 14 14 14 9 Z"
                  />
                  <path className={styles.quills} d="M17 9 H28 M19 5.5 L23 9 L19 12.5" />
                  <circle className={styles.puff} cx="34" cy="4.5" r="2.3" />
                  <circle className={styles.puff} cx="35.5" cy="13" r="1.8" />
                </svg>
              </span>
            )}
          </span>
          <span
            className={styles.emote}
            data-on={actor.emote ? '' : undefined}
            data-side={mutter.side}
            data-low={mutter.low ? '' : undefined}
            style={{ '--room': `${mutter.room}px`, '--drop': `${mutter.drop}px` } as CSSProperties}
          >
            {actor.emote && t.rebuild.emotes[actor.emote]}
          </span>
          {actor.line && (
            <p
              className={styles.says}
              role="status"
              data-hang={actor.y < HEADROOM ? 'drop' : undefined}
              style={
                {
                  width,
                  left: ROBOT_W / 2 - width / 2 + shift,
                  '--tail': `${width / 2 - shift}px`,
                } as CSSProperties
              }
            >
              {t.rebuild.says[actor.line]}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className={`win95-btn ${styles.skip}`}
        title={t.rebuild.skipTitle}
        onClick={onSkip}
      >
        {t.rebuild.skip}
      </button>
    </div>
  );
};
