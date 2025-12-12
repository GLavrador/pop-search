import { useStatus } from '../../context/StatusContext';
import styles from './styles.module.css';

export const StatusBar = () => {
  const { status } = useStatus();

  return (
    <div className={`win95-inset ${styles.bar}`}>
      <span className={styles.text}>{status}</span>
    </div>
  );
};