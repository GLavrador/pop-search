import type { RefObject } from 'react';
import { useI18n } from '../../i18n/languageContext';
import type { GuideStepCopy } from '../../constants/guide';
import styles from './styles.module.css';

interface AssistantProps {
  index: number;
  total: number;
  copy: GuideStepCopy;
  /** True when the app itself holds the way forward, so the balloon offers none. */
  act: boolean;
  isFirst: boolean;
  /** Label of the step's own tab, set only while the user is looking elsewhere. */
  strayedFrom: string | null;
  /** The robot flies in and out of this seat. */
  robotSeat: RefObject<HTMLDivElement | null>;
  /** True while it is off pointing at something, so the seat gives its width back. */
  robotAway: boolean;
  onBack: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onReturn: () => void;
  onClose: () => void;
}

export const Assistant = ({
  index,
  total,
  copy,
  act,
  isFirst,
  strayedFrom,
  robotSeat,
  robotAway,
  onBack,
  onNext,
  onJump,
  onReturn,
  onClose,
}: AssistantProps) => {
  const { t } = useI18n();

  // Exactly one way forward at a time: back to the step when the user wandered
  // off, the app's own control on a doing step, this button on a reading one.
  const forward = strayedFrom ? (
    <button type="button" className={`win95-btn ${styles.go}`} onClick={onReturn}>
      {t.guide.offScriptAction}
    </button>
  ) : act ? (
    <button type="button" className={styles.link} title={t.guide.skipTitle} onClick={onNext}>
      {t.guide.skip}
    </button>
  ) : (
    <button type="button" className={`win95-btn ${styles.go}`} onClick={onNext}>
      {copy.next ?? t.guide.next}
    </button>
  );

  return (
    <div className={styles.assistant}>
      <div
        ref={robotSeat}
        className={`${styles.slot} ${robotAway ? styles.slotEmpty : ''}`}
        aria-hidden="true"
      />

      <div className={`${styles.bubble} ${robotAway ? styles.bubbleAlone : ''}`}>
        <button
          type="button"
          className={styles.close}
          title={t.guide.closeTitle}
          aria-label={t.guide.close}
          onClick={onClose}
        />

        <div aria-live="polite">
          <p className={styles.title}>{copy.title}</p>
          {strayedFrom ? (
            <p className={styles.say}>{t.guide.offScript(strayedFrom)}</p>
          ) : (
            <>
              <div className={styles.say}>{copy.say}</div>
              {act && (
                <p className={styles.task}>
                  <span className={styles.yourTurn}>{t.guide.yourTurn}</span> {copy.task}
                </p>
              )}
            </>
          )}
        </div>

        <div className={styles.foot}>
          <div className={styles.progress}>
            <div className={styles.track}>
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
            <span className={styles.count} title={t.guide.progress(index + 1, total)}>
              {index + 1}/{total}
            </span>
          </div>

          <div className={styles.moves}>
            {!isFirst && (
              <button type="button" className={styles.link} onClick={onBack}>
                {t.guide.back}
              </button>
            )}
            {forward}
          </div>
        </div>
      </div>
    </div>
  );
};
