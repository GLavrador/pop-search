import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
} from 'react';
import { useI18n } from '../../../i18n/languageContext';
import { createStore } from '../../../utils/store';
import stop from '../../../assets/win98/msg_error-0.png';
import check from '../../../assets/win98/check-1.png';
import { useControls } from './controls';
import { useGameLoop } from './loop';
import { WORLD_H, clamp, type Input, type Playing } from './play';
import styles from './styles.module.css';

export interface ViewProps<S> {
  state: S;
  /** Less motion was asked for: nothing moves that the game does not need to move. */
  calm: boolean;
  /** The goal has just been reached. */
  glad: boolean;
}

/** One game: its rules, how it is drawn, and how many points set the icons free. */
export interface Cartridge<S extends Playing> {
  goal: number;
  /** It has something to duck under, and so needs a way to ask for that. */
  ducks: boolean;
  create: (width: number, seed: number) => S;
  step: (state: S, input: Input, dt: number) => S;
  View: ComponentType<ViewProps<S>>;
}

interface ArcadeProps<S extends Playing> {
  cartridge: Cartridge<S>;
  copy: { title: string; how: string; lost: readonly string[] };
  seed: number;
  best: number;
  /** The goal was reached on this visit, so the rescue is there for the taking. */
  earned: boolean;
  onEarn: () => void;
  /** A round ended on this many points. True when no round had ended on more. */
  onScore: (points: number) => boolean;
  /** The round in play has got to this many points. */
  onPoints?: (points: number) => void;
  onQuit: () => void;
}

interface Result {
  points: number;
  fresh: boolean;
  line: number;
}

const FIRST = { scale: 1, width: 360 };
// The hit is seen before the box that tells of it comes up.
const BOX_AFTER = 600;
const CHEER_FOR = 3800;
// What flies off the news that the goal is reached: which way each piece goes, and its colour.
const CONFETTI = [
  ['-128px', '-34px', '#e03020'],
  ['-96px', '42px', '#008000'],
  ['-58px', '-56px', '#000080'],
  ['-30px', '58px', '#d8a520'],
  ['32px', '-58px', '#e03020'],
  ['62px', '52px', '#000080'],
  ['98px', '-42px', '#008000'],
  ['130px', '32px', '#d8a520'],
  ['-150px', '8px', '#008080'],
  ['150px', '-8px', '#008080'],
] as const;

const wantsCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The window a game is played in: the game itself, the score under it, and what a round ends in. */
export const Arcade = <S extends Playing>({
  cartridge,
  copy,
  seed,
  best,
  earned,
  onEarn,
  onScore,
  onPoints,
  onQuit,
}: ArcadeProps<S>) => {
  const { t } = useI18n();
  const words = t.bin.games;
  const { goal, View } = cartridge;
  const [store] = useState(() => createStore(cartridge.create(FIRST.width, seed)));
  const state = useSyncExternalStore(store.subscribe, store.get);
  const [size, setSize] = useState(FIRST);
  const [result, setResult] = useState<Result | null>(null);
  const [cheering, setCheering] = useState(false);
  const [calm] = useState(wantsCalm);
  const game = useRef(store.get());
  const told = useRef({ earned, over: false, points: 0 });
  const rounds = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const node = useRef<HTMLDivElement | null>(null);
  const live = useRef({ size, onEarn, onScore, onPoints });
  const overId = useId();
  const controls = useControls(result === null, node);

  useEffect(() => {
    live.current = { size, onEarn, onScore, onPoints };
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
  };

  // The world is as tall as the field and as wide as the field lets it be.
  const field = useCallback((element: HTMLDivElement | null) => {
    node.current = element;
    if (!element) return;

    const measure = () => {
      const box = element.getBoundingClientRect();
      if (!box.height) return;
      const scale = box.height / WORLD_H;
      const width = clamp(box.width / scale, 260, 620);
      setSize((now) => (now.scale === scale && now.width === width ? now : { scale, width }));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(element);
    window.addEventListener('resize', measure);
    element.focus();
    return () => {
      watch.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useGameLoop(result === null, {
    step: (dt) => {
      const { width } = live.current.size;
      const now = game.current.width === width ? game.current : { ...game.current, width };
      game.current = cartridge.step(now, controls.take(), dt);
    },
    draw: () => {
      const now = game.current;
      if (now.score !== told.current.points) {
        told.current.points = now.score;
        live.current.onPoints?.(now.score);
      }
      if (!told.current.earned && now.score >= goal) {
        told.current.earned = true;
        live.current.onEarn();
        setCheering(true);
        later(CHEER_FOR, () => setCheering(false));
      }
      if (now.over && !told.current.over) {
        told.current.over = true;
        const points = now.score;
        const fresh = live.current.onScore(points);
        rounds.current += 1;
        const line = rounds.current;
        later(BOX_AFTER, () => setResult({ points, fresh, line }));
      }
      store.set(now);
    },
  });

  const again = () => {
    game.current = cartridge.create(size.width, seed + rounds.current * 7919);
    told.current.over = false;
    told.current.points = 0;
    store.set(game.current);
    setResult(null);
    node.current?.focus();
  };

  // Leaving in the middle of a round, what was scored so far still counts.
  const quit = () => {
    if (!told.current.over) onScore(game.current.score);
    onQuit();
  };

  const shownBest = Math.max(best, state.score);
  const met = state.score >= goal;

  return (
    <section className={`win95-border ${styles.arcade}`} aria-label={copy.title} data-arcade>
      <header className={styles.titleBar}>
        <span className={styles.title}>{copy.title}</span>
        <button type="button" className={styles.close} aria-label={words.quit} onClick={quit}>
          X
        </button>
      </header>

      <div
        ref={field}
        className={styles.field}
        role="application"
        aria-label={`${copy.title}. ${copy.how}`}
        tabIndex={0}
        data-calm={calm ? '' : undefined}
        data-hit={state.over ? '' : undefined}
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as Element).closest('button')) return;
          controls.jump();
        }}
      >
        <div
          className={styles.world}
          style={{
            width: size.width,
            height: WORLD_H,
            marginLeft: -size.width / 2,
            transform: `scale(${size.scale})`,
          }}
        >
          <View state={state} calm={calm} glad={cheering} />
        </div>

        <output className={styles.points} aria-live="off">
          {state.score}
        </output>
        {!state.started && <p className={styles.how}>{copy.how}</p>}

        {cheering && !result && (
          <div className={`win95-border ${styles.cheer}`} role="status">
            <strong>{words.unlocked.title}</strong>
            <span>{words.unlocked.text}</span>
            {CONFETTI.map(([dx, dy, colour]) => (
              <i key={dx} style={{ '--dx': dx, '--dy': dy, '--c': colour } as CSSProperties} />
            ))}
          </div>
        )}

        {result && (
          <div
            className={`win95-border ${styles.over}`}
            role="alertdialog"
            aria-labelledby={`${overId}-title`}
            aria-describedby={`${overId}-text`}
          >
            <div id={`${overId}-title`} className={styles.overTitle}>
              {copy.title}
            </div>
            <div className={styles.overBody}>
              <img src={stop} alt="" className={styles.stop} />
              <div id={`${overId}-text`} className={styles.overText}>
                <p>{copy.lost[result.line % copy.lost.length]}</p>
                <p>{words.over.tally(result.points, Math.max(best, result.points))}</p>
                {result.fresh && <p className={styles.fresh}>{words.newBest}</p>}
                <p>
                  {earned ? words.over.unlocked : words.over.short(Math.max(1, goal - result.points))}
                </p>
              </div>
            </div>
            <div className={styles.overButtons}>
              <button type="button" className="win95-btn" autoFocus onClick={again}>
                {words.over.again}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Whoever has no keyboard plays with these. They leave the keyboard where it was. */}
      {cartridge.ducks && (
        <div className={styles.pad}>
          <button
            type="button"
            className={`win95-btn ${styles.key}`}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={() => controls.duck(true)}
            onPointerUp={() => controls.duck(false)}
            onPointerLeave={() => controls.duck(false)}
            onPointerCancel={() => controls.duck(false)}
          >
            ▼ {words.dino.duck}
          </button>
          <button
            type="button"
            className={`win95-btn ${styles.key}`}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={() => controls.jump()}
          >
            ▲ {words.dino.jump}
          </button>
        </div>
      )}

      <footer className={styles.status}>
        <span className={styles.cell}>
          {words.points}: <b>{state.score}</b>
        </span>
        <span className={styles.cell} data-met={met || earned ? '' : undefined}>
          {words.goal}: <b>{goal}</b>
          {met && <img src={check} alt={words.met} className={styles.check} />}
        </span>
        <span className={styles.cell}>
          {words.best}: <b>{shownBest}</b>
        </span>
      </footer>
    </section>
  );
};
