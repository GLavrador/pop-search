import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { isAnyKey } from '../../utils/keys';
import { Robot } from '../Assistant/Robot';
import { BARS, useBarColors } from '../SystemBars/bars';
import styles from './styles.module.css';

interface CrashProps {
  error: Error;
  /** True when it crashed again right after being reopened. */
  again: boolean;
  onContinue: () => void;
}

export const Crash = ({ error, again, onContinue }: CrashProps) => {
  const { t } = useI18n();
  const goOn = useRef<HTMLButtonElement>(null);
  useBarColors(BARS.blue);

  useEffect(() => {
    goOn.current?.focus();

    // A key still held down from before the crash is not an answer to it.
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !isAnyKey(event)) return;
      event.preventDefault();
      onContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinue]);

  return (
    <div className={styles.screen} role="alert">
      <div className={styles.text}>
        <h1 className={styles.badge}>Pop Search</h1>
        <p>{t.crash.lead}</p>
        <p className={styles.error}>
          {error.name === 'Error' ? error.message : `${error.name}: ${error.message}`}
        </p>
        <ul className={styles.steps}>
          <li>{again ? t.crash.again : t.crash.reopen}</li>
          <li>{again ? t.crash.reload : t.crash.kept}</li>
        </ul>
        <button type="button" ref={goOn} className={styles.goOn} onClick={onContinue}>
          {t.crash.goOn}
          <span className={styles.cursor} aria-hidden="true">
            _
          </span>
        </button>
      </div>

      <div className={styles.fixer}>
        <p className={styles.says}>{again ? t.crash.robotAgain : t.crash.robot}</p>
        <span
          className={styles.robot}
          data-pose="point-up"
          data-face={again ? 'dizzy' : 'worried'}
        >
          <Robot />
          <span className={styles.wrench} aria-hidden="true">
            🔧
          </span>
        </span>
      </div>
    </div>
  );
};
