import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/languageContext';
import type { Dictionary } from '../../i18n/en';
import { Puppet } from '../Assistant/Puppet';
import { emoteSpot } from '../Rebuild/emoteSpot';
import binPicture from '../../assets/win98/recycle_bin_empty-2.png';
import type { Cast, Line, Point } from './stage';
import styles from './styles.module.css';

interface TripProps {
  cast: Cast;
  /** Where the picture of the bin is, when the robot goes down behind the front of it. */
  front: Point | null;
  /** How far down the mouth of the bin is, when the robot comes up through it. */
  hole: number | null;
  onSkip: () => void;
}

const ROBOT_W = 46;
const BALLOON_W = 250;
const EDGE = 10;
// Higher than this what it says hangs under it: over its head there is no room, or there is the bin.
const HEADROOM = 210;

const textOf = (line: Line, { bin }: Dictionary) =>
  line.on === 'going'
    ? bin.going[line.mood][line.turn % bin.going[line.mood].length]
    : bin.back[line.outcome][line.turn % bin.back[line.outcome].length];

/** The robot on its way into the bin or out of it, over the desktop and everything on it. */
export const Trip = ({ cast, front, hole, onSkip }: TripProps) => {
  const { t } = useI18n();
  const actor = useSyncExternalStore(cast.subscribe, cast.get);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  // The balloon is centred on it, then pushed back in from whichever edge it crosses.
  const screen = window.innerWidth;
  const width = Math.min(BALLOON_W, screen - 2 * EDGE);
  const wanted = (actor?.x ?? 0) + ROBOT_W / 2 - width / 2;
  const shift = Math.min(Math.max(wanted, EDGE), screen - EDGE - width) - wanted;
  const mutter = emoteSpot(actor?.x ?? 0, actor?.y ?? 0, screen);
  const place = actor && {
    transform: `translate3d(${actor.x}px, ${actor.y}px, 0)`,
    transitionDuration: `${actor.ms}ms`,
    transitionTimingFunction: actor.ease,
  };
  const body = actor && place && (
    <div className={styles.actor} style={place}>
      <span
        className={styles.body}
        style={{
          transform: `rotate(${actor.turn}deg) scale(${actor.squeeze.x}, ${actor.squeeze.y})`,
        }}
      >
        <Puppet
          pose={actor.pose}
          face={actor.face}
          talking={actor.talking}
          lean={actor.lean}
          gaze={actor.gaze}
        />
      </span>
    </div>
  );

  return (
    <div className={styles.scene} data-bin-trip>
      {actor && place && (
        <>
          {/* Coming up through the mouth of the bin, it is cut off along the edge and nowhere else. */}
          <div
            className={styles.hole}
            style={{ height: Math.max(0, hole ?? 0) }}
            data-cut={hole === null ? undefined : ''}
          >
            {body}
          </div>

          {front && (
            <img
              src={binPicture}
              alt=""
              className={styles.front}
              style={{ left: front.x, top: front.y }}
              data-bin-front
            />
          )}

          <div className={styles.actor} style={place}>
            <span
              className={styles.emote}
              data-on={actor.emote ? '' : undefined}
              data-side={mutter.side}
              data-low={mutter.low ? '' : undefined}
              style={{ '--room': `${mutter.room}px`, '--drop': `${mutter.drop}px` } as CSSProperties}
            >
              {actor.emote && t.bin.emotes[actor.emote]}
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
                {textOf(actor.line, t)}
              </p>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        className={`win95-btn ${styles.skip}`}
        title={t.bin.skipTitle}
        onClick={onSkip}
      >
        {t.bin.skip}
      </button>
    </div>
  );
};
