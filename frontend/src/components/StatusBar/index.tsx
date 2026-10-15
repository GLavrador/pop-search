import { useStatus } from '../../context/status';
import { useStatusFacts, type StatusScope } from '../../context/statusFacts';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import styles from './styles.module.css';

interface StatusBarProps {
  /** The screen in front, whose facts fill the cells on the right. */
  scope?: StatusScope | null;
}

export const StatusBar = ({ scope = null }: StatusBarProps) => {
  const { status } = useStatus();
  const { facts } = useStatusFacts();
  const { t } = useI18n();
  const cells = (scope && facts[scope]) || [];

  return (
    <div className={styles.bar} data-robot="status" {...helpAt('status')}>
      <div className={`win95-inset ${styles.cell} ${styles.message}`}>
        <span className={styles.text}>{status ?? t.common.ready}</span>
      </div>

      {cells.map(({ text, hint }) => (
        <div key={text} className={`win95-inset ${styles.cell}`} title={hint}>
          {text}
        </div>
      ))}
    </div>
  );
};
