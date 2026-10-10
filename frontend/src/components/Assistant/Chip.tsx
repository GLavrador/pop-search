import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import styles from './styles.module.css';

interface GuideChipProps {
  onOpen: () => void;
}

/** What is left of the invitation once a visitor tucks it away: it sits in the title bar. */
export const GuideChip = ({ onOpen }: GuideChipProps) => {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={styles.chip}
      title={t.guide.chip.title}
      aria-label={t.guide.chip.title}
      onClick={onOpen}
    >
      <span className={styles.mini}>
        <Robot className={styles.robotSmall} />
      </span>
      {t.guide.chip.label}
    </button>
  );
};
