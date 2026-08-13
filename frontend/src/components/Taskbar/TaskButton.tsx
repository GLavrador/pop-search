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
    className={`${styles.task} ${active ? styles.taskActive : ''}`}
  >
    <span className={styles.taskIcon}>{icon}</span>
    <span className={styles.taskLabel}>{label}</span>
  </button>
);
