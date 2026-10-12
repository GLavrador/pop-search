import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '../../context/authContext';
import { useI18n } from '../../i18n/languageContext';
import type { ServerStatus } from '../../hooks/useServerWake';
import {
  BOOT_LEAVE_MS,
  BOOT_LEAVE_UNANSWERED_MS,
  BOOT_LINE_EVERY_MS,
  BOOT_PATIENCE_MS,
} from '../../constants/startup';
import { isAnyKey } from '../../utils/keys';
import { Robot } from '../Assistant/Robot';
import styles from './styles.module.css';

interface BootProps {
  server: ServerStatus;
  onDone: () => void;
}

const CHECKS = 4;
// Until then a slow answer is just a slow answer.
const ASLEEP_AFTER_S = 2;
const FACES = { waking: 'sleepy', awake: 'happy', down: 'worried' } as const;

const onVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
};
const isVisible = () => document.visibilityState === 'visible';

/** The start-up screen. Every line on it is something that was really checked. */
export const Boot = ({ server, onDone }: BootProps) => {
  const { t, locale } = useI18n();
  const { isLoading, displayName } = useAuth();
  const [shown, setShown] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [outOfPatience, setOutOfPatience] = useState(false);
  // A tab opened in the background starts up when it is first looked at.
  const watched = useSyncExternalStore(onVisibility, isVisible);

  const allShown = shown >= CHECKS;
  const waking = server.state === 'waking';
  const asleep = waking && seconds >= ASLEEP_AFTER_S;
  const leaving = outOfPatience || (allShown && !isLoading && !waking);

  useEffect(() => {
    const began = Date.now();
    const tick = setInterval(() => setSeconds(Math.floor((Date.now() - began) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!watched) return;
    const line = setInterval(
      () => setShown((count) => Math.min(count + 1, CHECKS)),
      BOOT_LINE_EVERY_MS,
    );
    const patience = setTimeout(() => setOutOfPatience(true), BOOT_PATIENCE_MS);
    return () => {
      clearInterval(line);
      clearTimeout(patience);
    };
  }, [watched]);

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(onDone, waking ? BOOT_LEAVE_UNANSWERED_MS : BOOT_LEAVE_MS);
    return () => clearTimeout(id);
  }, [leaving, waking, onDone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isAnyKey(event)) onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  const tookMs = server.tookMs ?? 0;
  const took =
    tookMs < 1000
      ? `${Math.round(tookMs)} ms`
      : `${(tookMs / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} s`;

  const checks = [
    { label: t.boot.program, value: t.boot.ok, state: 'ok' },
    { label: t.boot.language, value: t.boot.languageName, state: 'ok' },
    isLoading
      ? { label: t.boot.session, value: t.boot.checking, state: 'wait' }
      : { label: t.boot.session, value: displayName ?? t.boot.visitor, state: 'ok' },
    server.state === 'awake'
      ? { label: t.boot.server, value: t.boot.awake(took), state: 'ok' }
      : server.state === 'down'
        ? { label: t.boot.server, value: t.boot.down, state: 'bad' }
        : {
            label: t.boot.server,
            value: asleep ? t.boot.waking(seconds) : t.boot.calling,
            state: 'wait',
          },
  ];

  const note = !allShown
    ? null
    : leaving
      ? waking
        ? t.boot.goingIn
        : t.boot.starting
      : asleep
        ? t.boot.asleep
        : null;

  return (
    <div className={styles.boot} onClick={onDone}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t.boot.title}</h1>
          <p className={styles.maker}>{t.boot.maker}</p>
        </div>
        <span className={styles.logo} data-face={FACES[server.state]}>
          <Robot />
        </span>
      </div>

      <div role="status">
        <ul className={styles.checks}>
          {checks.slice(0, shown).map((check) => (
            <li key={check.label} className={styles.check}>
              <span>{check.label}</span>
              <span className={styles.dots} aria-hidden="true" />
              <span className={styles.value} data-state={check.state}>
                {check.value}
              </span>
            </li>
          ))}
        </ul>

        {note && <p className={styles.note}>{note}</p>}
      </div>

      <button type="button" className={styles.skip}>
        {t.boot.skip}
        <span className={styles.cursor} aria-hidden="true">
          _
        </span>
      </button>
    </div>
  );
};
