import { ProgressBar } from '../ProgressBar';
import styles from './styles.module.css';

interface TaskProgressProps {
  onCancel: () => void;
}

export const TaskProgress = ({ onCancel }: TaskProgressProps) => {
  return (
    <div className={styles.container}>
      <ProgressBar loading={true} />
      <button 
        type="button" 
        onClick={onCancel}
        className="win95-btn"
      >
        Cancel
      </button>
    </div>
  );
};