import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import type { Slide } from '../Rebuild/stage';
import { OwnerContext } from '../Dialog/owner';
import styles from './styles.module.css';

export type WindowState = 'open' | 'minimized' | 'closing' | 'closed';

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  icon?: string;
  state?: WindowState;
  maximized?: boolean;
  shakeKey?: number;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  /** Shown in the title bar, just before the window controls. */
  aside?: ReactNode;
  /** Adds the "what's this?" button; `helping` is true while it is armed. */
  onHelp?: () => void;
  helping?: boolean;
  /** How much of it is still rolled up from the bottom, while it is being opened by hand. */
  shut?: Slide | null;
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
  maximized = false,
  shakeKey = 0,
  onMinimize,
  onMaximize,
  onClose,
  aside,
  onHelp,
  helping = false,
  shut = null,
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
        maximized ? styles.maximized : '',
      ].join(' ')}
      aria-hidden={hidden}
      style={
        shut
          ? {
              clipPath: `inset(0 0 ${shut.by * 100}% 0)`,
              transition: `clip-path ${shut.ms}ms ease-out`,
            }
          : undefined
      }
      data-robot="window"
      data-maximized={maximized || undefined}
    >
      <div className={styles.titleBar}>
        <div className={styles.titleText}>
          <span>{icon}</span>
          {title}
        </div>
        <div className={styles.controls}>
          {aside}
          {onHelp && (
            <button
              className={`${styles.controlButton} ${styles.helpButton} ${helping ? styles.armed : ''}`}
              title={t.robot.whatsThis.title}
              aria-label={t.robot.whatsThis.button}
              aria-pressed={helping}
              data-help-toggle
              onClick={onHelp}
            >
              ?
            </button>
          )}
          <button
            className={styles.controlButton}
            aria-label={t.window.minimize}
            onClick={onMinimize}
            {...helpAt('window.buttons')}
          >
            _
          </button>
          <button
            className={styles.controlButton}
            aria-label={maximized ? t.window.restore : t.window.maximize}
            onClick={onMaximize}
            {...helpAt('window.buttons')}
          >
            {maximized ? '❐' : '□'}
          </button>
          <button
            className={styles.controlButton}
            aria-label={t.window.close}
            onClick={onClose}
            data-robot-zone="close"
            {...helpAt('window.buttons')}
          >
            X
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <OwnerContext.Provider value={state === 'open'}>{children}</OwnerContext.Provider>
      </div>
    </div>
  );
};
