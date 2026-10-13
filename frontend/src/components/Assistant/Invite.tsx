import type { RefObject } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import styles from './styles.module.css';

interface GuideInviteProps {
  /** Where the robot sits to do the inviting itself. */
  robotSeat: RefObject<HTMLDivElement | null>;
  onStart: () => void;
  /** Put away for now. It is back the next time the page opens. */
  onClose: () => void;
  /** Asked not to be shown again, which is what is remembered. */
  onHide: () => void;
}

/** The robot asking a visitor to take the guide, above the tabs so it is there on all of them. */
export const GuideInvite = ({ robotSeat, onStart, onClose, onHide }: GuideInviteProps) => {
  const { t } = useI18n();
  const copy = t.guide.invite;

  return (
    <div className={`${styles.assistant} ${styles.calling}`} {...helpAt('guide.invite')}>
      <div ref={robotSeat} className={styles.slot} aria-hidden="true" />
      <div className={styles.bubble}>
        <button
          type="button"
          className={styles.close}
          title={copy.close}
          aria-label={copy.close}
          onClick={onClose}
        />
        <div className={styles.callText}>
          <p className={styles.title}>{copy.lead}</p>
          <p className={styles.say}>{copy.text}</p>
        </div>
        <div className={styles.callMoves}>
          <button type="button" className={`win95-btn ${styles.go}`} onClick={onStart}>
            {copy.start}
          </button>
          <button type="button" className={styles.link} title={copy.hideTitle} onClick={onHide}>
            {copy.hide}
          </button>
        </div>
      </div>
    </div>
  );
};
