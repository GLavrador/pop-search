import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { useAssistantVisibility } from '../../hooks/useAssistantVisibility';
import styles from './styles.module.css';

export const Floppy = ({ alarmed = false }: { alarmed?: boolean }) => (
  <svg className={styles.character} viewBox="0 0 48 48" role="img" aria-hidden="true">
    <path d="M3 3 h33 l9 9 v33 h-42 z" className={styles.body} />
    <rect x="14" y="3" width="20" height="15" className={styles.shutter} />
    <rect x="27" y="5" width="5" height="11" className={styles.shutterWindow} />
    <rect x="9" y="25" width="30" height="19" className={styles.label} />

    <g className={styles.eyes}>
      <circle cx="18" cy="32" r="3.6" className={styles.eyeWhite} />
      <circle cx="30" cy="32" r="3.6" className={styles.eyeWhite} />
      <circle cx="18" cy="32" r="1.7" className={styles.pupil} />
      <circle cx="30" cy="32" r="1.7" className={styles.pupil} />
    </g>

    <path
      d={alarmed ? 'M19 39 q5 -4 10 0' : 'M19 38 q5 4 10 0'}
      className={styles.mouth}
      fill="none"
    />
  </svg>
);

interface AssistantProps {
  /** Identity of the current tip. Changing it rewinds the deck to its first card. */
  tipKey: string;
  messages: ReactNode[];
  alarmed?: boolean;
  step?: string;
}

export const Assistant = ({ tipKey, messages, alarmed = false, step }: AssistantProps) => {
  const { t } = useI18n();
  const { dismissed, dismiss, restore } = useAssistantVisibility();
  const [card, setCard] = useState(0);

  useEffect(() => {
    setCard(0);
  }, [tipKey]);

  const total = messages.length;
  const current = Math.min(card, Math.max(total - 1, 0));

  if (dismissed) {
    return (
      <div className={styles.restoreRow}>
        <button type="button" className={`win95-btn ${styles.restore}`} onClick={restore}>
          <span className={styles.restoreIcon} aria-hidden="true">
            <Floppy />
          </span>
          {t.assistant.restore}
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.wrapper} key={tipKey} aria-live="polite">
      <div className={styles.stage}>
        <Floppy alarmed={alarmed} />
      </div>

      <div className={`win95-border ${styles.bubble}`}>
        <div className={styles.bubbleBar}>
          <span className={styles.bubbleTitle}>
            {t.assistant.label}
            {step ? ` - ${step}` : ''}
          </span>
          <button
            type="button"
            className={`win95-btn ${styles.dismiss}`}
            onClick={dismiss}
            aria-label={t.assistant.close}
          >
            ✕
          </button>
        </div>
        <p className={styles.message}>{messages[current]}</p>

        {total > 1 && (
          <div className={styles.deck}>
            <button
              type="button"
              className={`win95-btn ${styles.page}`}
              onClick={() => setCard(current - 1)}
              disabled={current === 0}
              aria-label={t.assistant.previous}
            >
              ‹
            </button>
            <span className={styles.counter}>{t.assistant.card(current + 1, total)}</span>
            <button
              type="button"
              className={`win95-btn ${styles.page}`}
              onClick={() => setCard(current + 1)}
              disabled={current === total - 1}
              aria-label={t.assistant.next}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
