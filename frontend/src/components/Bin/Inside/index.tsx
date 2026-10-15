import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useI18n } from '../../../i18n/languageContext';
import { Puppet } from '../../Assistant/Puppet';
import { createVariety } from '../../Assistant/variety';
import { isTrashable, useDesktopIcons, type Trashable } from '../../Desktop/icons';
import flappyIcon from '../../../assets/win98/joystick-2.png';
import dinoIcon from '../../../assets/win98/joystick_button.png';
import directIcon from '../../../assets/win98/recycle_bin_file.png';
import leaveIcon from '../../../assets/win98/shut_down_normal-0.png';
import broom from '../../../assets/win98/clean_drive-0.png';
import { Arcade } from '../Arcade';
import { DINO_GAME, FLAPPY_GAME, GOALS } from '../Arcade/games';
import { useRecords, type Game } from '../records';
import { Clutter, type ClutterHandle } from './Clutter';
import { Confirm } from './Confirm';
import { Defrag } from './Defrag';
import { Explorer, type Way } from './Explorer';
import { File } from './File';
import { FINDS } from './finds';
import { Legend } from './Legend';
import { progressFor } from './disk';
import { useSweep } from './useSweep';
import styles from './styles.module.css';

interface InsideProps {
  /** What was thrown away and lies here, waiting. */
  trashed: readonly Trashable[];
  /** False while it is only seen on the way in or out, and nothing in it answers. */
  active: boolean;
  /** Which of its greetings the robot has for whoever came in. */
  greeting: number;
  onRescue: () => void;
  onLeave: () => void;
}

// Where the bin is taller than it is wide the robot hovers over what it came for, for want of room beside it.
const STACKED = '(max-aspect-ratio: 1 / 1), (max-width: 620px)';
// A phone: what the robot says once the goal is reached is short enough to stay on the screen.
const NARROW = '(max-width: 620px)';
// The robot on its way to a game, and its finger on the button.
const TO_BUTTON = 560;
const ON_BUTTON = 240;
// How long it has its say when it is grabbed at, before it goes back to what it was saying.
const FLINCH_FOR = 2600;
// Out of the game, the robot starts cleaning from where it stands once it is drawn there again.
const BACK_IN = 60;
// The room kept over the robot for what it says, each way from its middle.
const TALK = { left: 130, right: 200, up: 150 };
const ROBOT_H = 53;
const LINES = [0, 1, 2];

const wantsCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const freshSeed = () => Date.now() % 2147483647;
const percentOf = (reached: number) => Math.round(progressFor(reached) * 100);

const JOLT: Keyframe[] = [
  { transform: 'translate(0, 0)' },
  { transform: 'translate(-3px, 1px) rotate(-6deg)' },
  { transform: 'translate(3px, 0) rotate(5deg)' },
  { transform: 'translate(0, 0)' },
];

/**
 * The inside of the bin: a Disk Defragmenter left running and stuck for decades,
 * with everything that was ever thrown away lying on its disk. What the robot
 * came for lies there too, and the bin's own window lists the ways on: win it
 * back at one of two old games, take it without playing, or go without it.
 * Playing is what gets the defragmenting going again, and its bar fills up to
 * the goal. Once the goal is reached the robot puts the whole disk in order.
 */
export const Inside = ({ trashed, active, greeting, onRescue, onLeave }: InsideProps) => {
  const { t } = useI18n();
  const copy = t.bin.inside;
  const lost = useDesktopIcons('', '').filter(
    ({ zone }) => isTrashable(zone) && trashed.includes(zone),
  );
  const { records, score } = useRecords();
  const [game, setGame] = useState<{ kind: Game; seed: number } | null>(null);
  const [earned, setEarned] = useState(false);
  const [clean, setClean] = useState(false);
  const [reached, setReached] = useState(0);
  const [asking, setAsking] = useState(false);
  const [legend, setLegend] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const [pressing, setPressing] = useState<{ key: Game; dx: number; dy: number; down: boolean } | null>(
    null,
  );
  const [flinch, setFlinch] = useState<{ line: number } | null>(null);
  const [stacked] = useState(() => window.matchMedia(STACKED).matches);
  const [narrow] = useState(() => window.matchMedia(NARROW).matches);
  const [calm] = useState(wantsCalm);
  const [vary] = useState(() => createVariety());
  const [cleaningLine, setCleaningLine] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const keeper = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLElement>(null);
  const stand = useRef<HTMLDivElement>(null);
  const junk = useRef<ClutterHandle>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const live = useRef({ earned });
  const tidying = useRef(false);
  const { sweeper, closing, wiping, sweep } = useSweep(() => setClean(true));
  const sweeping = sweeper !== null;

  useEffect(() => {
    live.current = { earned };
  });

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (ms: number, run: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      run();
    }, ms);
    timers.current.add(id);
    return id;
  };

  // What the scenery must leave clear: the bin's window, and the robot with room over it for what it says.
  // Neither is there while a game is played, and then the scenery stays where it was.
  const avoid = useCallback(() => {
    const own = menu.current?.getBoundingClientRect();
    const spot = stand.current?.getBoundingClientRect();
    if (!own || !spot) return null;
    const middle = spot.left + spot.width / 2;
    const talk = new DOMRect(middle - TALK.left, spot.top - TALK.up, TALK.left + TALK.right, TALK.up);
    const den = stand.current?.parentElement?.getBoundingClientRect() ?? spot;
    return [own, den, talk];
  }, []);

  useEffect(() => {
    if (active) frame.current?.focus();
  }, [active]);

  const play = (kind: Game) => setGame({ kind, seed: freshSeed() });
  const quit = () => {
    setGame(null);
    frame.current?.focus();
    if (live.current.earned) tidyUp();
  };

  // The robot flies over to the game it was asked for and presses it, and only then is it opened.
  const pick = (key: string, button: HTMLButtonElement) => {
    if (key === 'direct') {
      setAsking(true);
      return;
    }
    if (key === 'leave') {
      onLeave();
      return;
    }
    const kind = key as Game;
    if (pressing || sweeping) return;
    const from = keeper.current?.getBoundingClientRect();
    if (calm || !from) {
      play(kind);
      return;
    }
    const to = button.getBoundingClientRect();
    setFlinch(null);
    setPressing({
      key: kind,
      dx: to.right - 8 - from.left,
      dy: to.top + to.height / 2 - ROBOT_H / 2 - from.top,
      down: false,
    });
    later(TO_BUTTON, () => setPressing((now) => now && { ...now, down: true }));
    later(TO_BUTTON + ON_BUTTON, () => {
      setPressing(null);
      play(kind);
    });
  };

  // It cannot be picked up in here. It says why, and goes back to what it was saying.
  const flinchAt = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grabbedAt = () => {
    if (pressing || sweeping) return;
    if (flinchAt.current) clearTimeout(flinchAt.current);
    setFlinch({ line: vary('flinch', LINES) });
    if (!calm) keeper.current?.animate?.(JOLT, { duration: 320, easing: 'ease-out' });
    flinchAt.current = later(FLINCH_FOR, () => setFlinch(null));
  };

  // Once the goal is reached and the game is closed, the robot puts the disk in order: straight
  // away for whoever asked for less motion, and otherwise by hand, in sight.
  const tidyUp = () => {
    if (tidying.current) return;
    tidying.current = true;
    if (calm) {
      setClean(true);
      return;
    }
    setCleaningLine(vary('cleaning', LINES));
    // Once it is drawn back in its place, out of the game.
    later(BACK_IN, () => {
      const home = keeper.current?.getBoundingClientRect();
      if (!home) {
        setClean(true);
        return;
      }
      sweep({
        from: { x: home.left, y: home.top },
        back: () => {
          const now = keeper.current?.getBoundingClientRect();
          return now ? { x: now.left, y: now.top } : null;
        },
        order: () => junk.current?.order() ?? [],
      });
    });
  };

  const tally = (kind: Game) => ({ goal: GOALS[kind], best: records[kind] });
  const ways: Way[] = [
    { key: 'flappy', icon: flappyIcon, ...copy.flappy, ...tally('flappy') },
    { key: 'dino', icon: dinoIcon, ...copy.dino, ...tally('dino') },
    // Once the goal is reached the rescue is down by the bar, and only there.
    ...(earned ? [] : [{ key: 'direct', icon: directIcon, ...copy.direct }]),
    { key: 'leave', icon: leaveIcon, ...copy.leave },
  ];

  const thrownAway = lost.map(({ zone, art, label }) => (
    <File key={zone} art={art} name={label} shortcut chosen />
  ));

  const picked = FINDS.find(({ id }) => id === found);
  const playing = (kind: Game) => ({
    best: records[kind],
    earned,
    onEarn: () => {
      live.current.earned = true;
      setEarned(true);
    },
    // A round is over, or was left. Short of the goal, the defragmenting is back where it was left.
    onScore: (points: number) => {
      if (!live.current.earned) setReached(0);
      return score(kind, points);
    },
    // Only when the bar would show it: a point that moves it by less than a percent changes nothing on screen.
    onPoints: (points: number) => {
      const next = points / GOALS[kind];
      setReached((now) => (percentOf(now) === percentOf(next) ? now : next));
    },
    onQuit: quit,
  });

  const says = useMemo(() => {
    if (flinch) return (clean ? copy.untouchedClean : copy.untouchable)[flinch.line];
    if (earned) return narrow ? copy.wonShort : copy.won;
    return copy.says[greeting % copy.says.length];
  }, [flinch, clean, earned, greeting, copy, narrow]);

  return (
    <div
      ref={frame}
      className={styles.inside}
      role="dialog"
      aria-modal="true"
      aria-label={copy.spoken}
      tabIndex={-1}
      data-bin-inside
      data-playing={game ? '' : undefined}
      data-earned={earned ? '' : undefined}
      data-wiping={wiping ? '' : undefined}
      data-clean={clean ? '' : undefined}
    >
      <Defrag
        progress={earned ? 1 : progressFor(reached)}
        ready={earned}
        onRescue={onRescue}
        onLegend={() => setLegend(true)}
      />

      {/* The screen itself, worn: lines, the grain of its cells, and a few that died. */}
      {!clean && <div className={styles.screen} aria-hidden="true" />}

      <div className={styles.room} inert={asking || legend}>
        {FINDS.map((find) => (
          <button
            key={find.id}
            type="button"
            className={styles.find}
            style={{ '--x': `${find.x}%`, '--y': `${find.y}%` } as CSSProperties}
            aria-label={find.name(t)}
            onClick={() => setFound(find.id)}
          >
            <File art={find.art} name={find.name(t)} />
          </button>
        ))}

        {game === null ? (
          <>
            <Explorer
              ref={menu}
              ways={ways}
              pressed={pressing?.down ? pressing.key : null}
              ready={earned}
              onPick={pick}
            />

            <div className={styles.den}>
              <div ref={stand} className={styles.keeper}>
                {!pressing && !sweeping && (
                  <p className={styles.balloon} role="status">
                    {says}
                  </p>
                )}
                <span
                  ref={keeper}
                  className={styles.puppet}
                  data-away={sweeping ? '' : undefined}
                  style={
                    pressing
                      ? {
                          transform: `translate(${pressing.dx}px, ${pressing.dy}px)`,
                          transitionDuration: `${TO_BUTTON}ms`,
                        }
                      : undefined
                  }
                  onPointerDown={grabbedAt}
                >
                  <Puppet
                    pose={
                      pressing
                        ? pressing.down
                          ? 'point-left'
                          : 'fly'
                        : earned && !flinch
                          ? 'cheer'
                          : stacked
                            ? 'hover'
                            : 'point-right'
                    }
                    face={flinch ? 'worried' : pressing ? 'brave' : earned ? 'happy' : 'neutral'}
                    lean={pressing && !pressing.down ? -8 : 0}
                    gaze={pressing ? { x: -1, y: 0 } : stacked ? { x: 0, y: 1 } : { x: 0.6, y: 0.2 }}
                  />
                </span>
              </div>
              <div className={styles.lost}>{thrownAway}</div>
            </div>
          </>
        ) : (
          <div className={styles.hall}>
            <div className={styles.prize}>
              <span>{copy.pile}:</span>
              {lost.map(({ zone, label }) => (
                <b key={zone}>{label}</b>
              ))}
            </div>
            {game.kind === 'flappy' ? (
              <Arcade
                key={game.seed}
                cartridge={FLAPPY_GAME}
                copy={t.bin.games.flappy}
                seed={game.seed}
                {...playing('flappy')}
              />
            ) : (
              <Arcade
                key={game.seed}
                cartridge={DINO_GAME}
                copy={t.bin.games.dino}
                seed={game.seed}
                {...playing('dino')}
              />
            )}
          </div>
        )}
        {/* Last, once what it keeps clear of is on the page. It is drawn under it all the same. */}
        <Clutter
          handle={junk}
          closing={closing}
          tidy={clean}
          held={sweeping}
          avoid={avoid}
          layout={game ? 'playing' : earned ? 'earned' : 'choosing'}
        />
      </div>

      {sweeper && (
        <div
          className={styles.sweeper}
          style={{
            transform: `translate3d(${sweeper.x}px, ${sweeper.y}px, 0)`,
            transitionDuration: `${sweeper.ms}ms`,
            transitionTimingFunction: sweeper.ease,
          }}
          data-bin-sweeper
        >
          {sweeper.talking && (
            <p className={styles.balloon} role="status">
              {copy.cleaning[cleaningLine]}
            </p>
          )}
          <Puppet pose={sweeper.pose} face={sweeper.face} lean={sweeper.lean} />
          {sweeper.broom && <img src={broom} alt="" className={styles.broom} />}
        </div>
      )}

      {picked?.open(() => setFound(null))}
      {legend && <Legend onClose={() => setLegend(false)} />}
      {asking && <Confirm onYes={onRescue} onNo={() => setAsking(false)} />}
    </div>
  );
};
