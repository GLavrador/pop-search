import { useId, type KeyboardEvent } from 'react';
import { useI18n } from '../../../i18n/languageContext';
import type { Block } from './disk';
import styles from './styles.module.css';

interface LegendProps {
  onClose: () => void;
}

const KEYS: readonly Block[] = ['done', 'data', 'moving', 'lost', 'bad', 'free'];

/** What each colour on the disk means, as the Defragmenter's own legend says it. */
export const Legend = ({ onClose }: LegendProps) => {
  const { t } = useI18n();
  const copy = t.bin.inside.defrag.key;
  const titleId = useId();

  const handleKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onClose();
  };

  return (
    <div className={styles.veil}>
      <div
        className={`win95-border ${styles.legend}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKey}
      >
        <div className={styles.bar}>
          <span id={titleId}>{copy.title}</span>
          <button
            type="button"
            className={styles.barClose}
            aria-label={t.common.closeOf(copy.title)}
            onClick={onClose}
          >
            X
          </button>
        </div>
        <ul className={styles.keys}>
          {KEYS.map((block) => (
            <li key={block}>
              <span className={styles.swatch} data-block={block} />
              {copy[block]}
            </li>
          ))}
        </ul>
        <div className={styles.confirmButtons}>
          <button type="button" className="win95-btn" autoFocus onClick={onClose}>
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
};
