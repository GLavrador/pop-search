import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import type { ClockState, Slide } from '../Rebuild/stage';
import logo from '../../assets/windows-98-logo.png';
import styles from './styles.module.css';

const CLOCK_TICK_MS = 20_000;

const useClock = (locale: string): string => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  return now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

interface TaskbarProps {
  children?: ReactNode;
  /** How far under the edge of the screen it is, while it is being pulled back up. */
  sunk?: Slide;
  /** False while the bar is up but its Start button has not been put on yet. */
  start?: boolean;
  clock?: ClockState;
  /** Nothing on it answers: something else has the screen. */
  frozen?: boolean;
}

export const Taskbar = ({
  children,
  sunk,
  start = true,
  clock = 'on',
  frozen = false,
}: TaskbarProps) => {
  const { t, locale } = useI18n();
  const time = useClock(locale);
  const moved = sunk !== undefined && (sunk.by !== 0 || sunk.ms !== 0);

  return (
    <div
      className={styles.taskbar}
      data-robot="taskbar"
      data-start={start ? (frozen ? 'new' : undefined) : 'none'}
      inert={frozen}
      style={
        moved
          ? {
              transform: `translateY(${sunk.by * 100}%)`,
              transition: `transform ${sunk.ms}ms ease-out`,
            }
          : undefined
      }
    >
      <button
        type="button"
        className={styles.start}
        data-robot="start"
        data-robot-zone="start"
        {...helpAt('taskbar.start')}
      >
        <img src={logo} alt="" className={styles.logo} />
        {t.taskbar.start}
      </button>

      <span className={styles.divider} />

      <div className={styles.tasks}>{children}</div>

      {clock !== 'none' && (
        <div className={styles.tray} data-clock={clock}>
          <span
            className={styles.clock}
            data-robot="clock"
            data-robot-zone="clock"
            {...helpAt('taskbar.clock')}
          >
            {clock === 'on' ? time : clock === 'unset' ? '12:00' : '--:--'}
          </span>
        </div>
      )}
    </div>
  );
};
