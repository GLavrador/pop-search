import { useId, useRef, type KeyboardEvent } from 'react';
import { useI18n } from '../../../i18n/languageContext';
import question from '../../../assets/win98/msg_question-0.png';
import styles from './styles.module.css';

interface ConfirmProps {
  onYes: () => void;
  onNo: () => void;
}

/** "Are you sure?", the way Windows asks it: over everything, until it gets a yes or a no. */
export const Confirm = ({ onYes, onNo }: ConfirmProps) => {
  const { t } = useI18n();
  const copy = t.bin.inside.confirm;
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const textId = useId();

  // The keyboard stays in the box: Tab goes round its buttons and Escape is a no.
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onNo();
      return;
    }
    if (event.key !== 'Tab') return;

    const buttons = [...(box.current?.querySelectorAll('button') ?? [])];
    const from = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const to = (from + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[to]?.focus();
  };

  return (
    <div className={styles.veil}>
      <div
        ref={box}
        className={`win95-border ${styles.confirm}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        onKeyDown={handleKey}
      >
        <div className={styles.bar}>
          <span id={titleId}>{copy.title}</span>
          <button
            type="button"
            className={styles.barClose}
            aria-label={t.common.closeOf(copy.title)}
            onClick={onNo}
          >
            X
          </button>
        </div>
        <div className={styles.confirmBody}>
          <img src={question} alt="" />
          <div id={textId}>
            <p>
              <strong>{copy.text}</strong>
            </p>
            <p>{copy.detail}</p>
          </div>
        </div>
        <div className={styles.confirmButtons}>
          <button type="button" className="win95-btn" autoFocus onClick={onYes}>
            {copy.yes}
          </button>
          <button type="button" className="win95-btn" onClick={onNo}>
            {copy.no}
          </button>
        </div>
      </div>
    </div>
  );
};
