import { ProgressBar } from '../ProgressBar';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

interface TaskProgressProps {
  onCancel: () => void;
}

export const TaskProgress = ({ onCancel }: TaskProgressProps) => {
  const { t } = useI18n();

  return (
    <div className={styles.container}>
      <ProgressBar loading={true} />
      <button
        type="button"
        onClick={onCancel}
        className="win95-btn"
      >
        {t.common.cancel}
      </button>
    </div>
  );
};
