import { useMemo, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { pickTip, type AssistantContext, type TipId } from '../../constants/assistantTips';
import styles from './styles.module.css';

const DISMISSED_KEY = 'pop-search:assistant-dismissed';

const wasDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

const rememberDismissal = () => {
  try {
    sessionStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // A blocked storage is not a reason to keep the assistant on screen.
  }
};

const Floppy = ({ alarmed }: { alarmed: boolean }) => (
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

interface SearchAssistantProps extends AssistantContext {}

export const SearchAssistant = (props: SearchAssistantProps) => {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(wasDismissed);

  const tipId = useMemo(() => pickTip(props), [props]);

  if (dismissed || !tipId) return null;

  const tips = t.assistant.tips;

  const message: ReactNode =
    tipId === 'thresholdTooHigh'
      ? tips.thresholdTooHigh(Math.round(props.threshold * 100))
      : tips[tipId as Exclude<TipId, 'thresholdTooHigh'>];

  const alarmed = tipId === 'thresholdTooHigh' || tipId === 'textTooRestrictive' || tipId === 'nothingFound';

  const dismiss = () => {
    rememberDismissal();
    setDismissed(true);
  };

  return (
    <aside className={styles.wrapper} key={tipId} aria-live="polite">
      <div className={styles.stage}>
        <Floppy alarmed={alarmed} />
      </div>

      <div className={`win95-border ${styles.bubble}`}>
        <div className={styles.bubbleBar}>
          <span className={styles.bubbleTitle}>{t.assistant.label}</span>
          <button
            type="button"
            className={`win95-btn ${styles.dismiss}`}
            onClick={dismiss}
            aria-label={t.assistant.close}
          >
            ✕
          </button>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </aside>
  );
};
