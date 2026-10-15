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
    <img src={icon} alt="" className={styles.taskIcon} draggable={false} />
    <span className={styles.taskLabel}>{label}</span>
  </button>
);
