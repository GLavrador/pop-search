import { helpAt } from '../../context/robotContext';
import styles from './styles.module.css';

interface TaskButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}

export const TaskButton = ({ icon, label, active, onClick }: TaskButtonProps) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    data-robot="task"
    data-robot-zone="task"
    {...helpAt('taskbar.task')}
    className={`${styles.task} ${active ? styles.taskActive : ''}`}
  >
    <span className={styles.taskIcon}>{icon}</span>
    <span className={styles.taskLabel}>{label}</span>
  </button>
);
