import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
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

export const Taskbar = ({ children }: { children?: ReactNode }) => {
  const { t, locale } = useI18n();
  const time = useClock(locale);

  return (
    <div className={styles.taskbar}>
      <button type="button" className={styles.start}>
        <img src={logo} alt="" className={styles.logo} />
        {t.taskbar.start}
      </button>

      <span className={styles.divider} />

      <div className={styles.tasks}>{children}</div>

      <div className={styles.tray}>
        <span className={styles.clock}>{time}</span>
      </div>
    </div>
  );
};
