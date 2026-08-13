import { useStatus } from '../../context/StatusContext';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

export const StatusBar = () => {
  const { status } = useStatus();
  const { t } = useI18n();

  return (
    <div className={`win95-inset ${styles.bar}`}>
      <span className={styles.text}>{status ?? t.common.ready}</span>
    </div>
  );
};
