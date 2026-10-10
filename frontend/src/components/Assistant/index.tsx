import { useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import type { GuideStepCopy } from '../../constants/guide';
import styles from './styles.module.css';

interface AssistantProps {
  index: number;
  total: number;
  copy: GuideStepCopy;
  isFirst: boolean;
  isLast: boolean;
  /** Label of the step's own tab, set only while the user is looking elsewhere. */
  strayedFrom: string | null;
  onBack: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onReturn: () => void;
  onHide: () => void;
  onQuit: () => void;
}

export const Assistant = ({
  index,
  total,
  copy,
  isFirst,
  isLast,
  strayedFrom,
  onBack,
  onNext,
  onJump,
  onReturn,
  onHide,
  onQuit,
}: AssistantProps) => {
  const { t } = useI18n();
  const [pokes, setPokes] = useState(0);

  return (
    <div className={`win95-border ${styles.assistant}`}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.avatar}
          title={t.guide.poke}
          aria-label={t.guide.poke}
          onClick={() => setPokes((count) => count + 1)}
        >
          <Robot key={`${index}-${pokes}`} talking />
          {pokes > 0 && (
            <span key={pokes} className={styles.beep}>
              {t.guide.beeps[pokes % t.guide.beeps.length]}
            </span>
          )}
        </button>

        <div className={styles.bubble} aria-live="polite">
          <p className={styles.title}>{copy.title}</p>

          {strayedFrom ? (
            <div className={styles.strayed}>
              <p className={styles.say}>{t.guide.offScript(strayedFrom)}</p>
              <button type="button" className="win95-btn" onClick={onReturn}>
                {t.guide.offScriptAction}
              </button>
            </div>
          ) : (
            <p className={styles.say}>{copy.say}</p>
          )}
        </div>

        <button
          type="button"
          className={styles.control}
          title={t.guide.hideTitle}
          aria-label={t.guide.hide}
          onClick={onHide}
        />
      </div>

      <div className={styles.meta}>
        <div className={styles.pips}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.pip} ${i < index ? styles.pipDone : ''} ${i === index ? styles.pipHere : ''}`}
              aria-label={t.guide.jumpTo(i + 1)}
              aria-current={i === index}
              onClick={() => onJump(i)}
            />
          ))}
        </div>
        <span className={styles.counter}>{t.guide.counter(index + 1, total)}</span>
      </div>

      <div className={styles.actions}>
        <button type="button" className="win95-btn" onClick={onBack} disabled={isFirst}>
          {t.guide.back}
        </button>
        <button
          type="button"
          className={`win95-btn ${styles.advance}`}
          onClick={isLast ? onQuit : onNext}
        >
          {isLast ? t.guide.finish : t.guide.next}
        </button>
        <button type="button" className={styles.quit} onClick={onQuit}>
          {t.guide.quit}
        </button>
      </div>
    </div>
  );
};
