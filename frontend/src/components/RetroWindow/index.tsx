import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

export type WindowState = 'open' | 'minimized' | 'closing' | 'closed';

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  icon?: string;
  state?: WindowState;
  shakeKey?: number;
  onMinimize?: () => void;
  onClose?: () => void;
}

const SHAKE_MS = 340;

const SHAKE_FRAMES: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-7px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
];

export const RetroWindow = ({
  title,
  children,
  icon = '🌐',
  state = 'open',
  shakeKey = 0,
  onMinimize,
  onClose,
}: RetroWindowProps) => {
  const { t } = useI18n();
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shakeKey === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    frame.current?.animate(SHAKE_FRAMES, { duration: SHAKE_MS, easing: 'ease-in-out' });
  }, [shakeKey]);

  const hidden = state === 'minimized' || state === 'closed';

  return (
    <div
      ref={frame}
      className={[
        'win95-border',
        styles.window,
        state === 'minimized' ? styles.minimized : '',
        state === 'closing' ? styles.closing : '',
        state === 'closed' ? styles.closed : '',
      ].join(' ')}
      aria-hidden={hidden}
    >
      <div className={styles.titleBar}>
        <div className={styles.titleText}>
          <span>{icon}</span>
          {title}
        </div>
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            aria-label={t.window.minimize}
            onClick={onMinimize}
          >
            _
          </button>
          <button className={styles.controlButton} aria-label={t.window.maximize}>□</button>
          <button
            className={styles.controlButton}
            aria-label={t.window.close}
            onClick={onClose}
          >
            X
          </button>
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
