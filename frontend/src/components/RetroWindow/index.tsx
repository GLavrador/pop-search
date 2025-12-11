import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  icon?: string; 
}

export const RetroWindow = ({ title, children, icon = '🌐' }: RetroWindowProps) => {
  return (
    <div className={`win95-border ${styles.window}`}>
      <div className={styles.titleBar}>
        <div className={styles.titleText}>
          <span>{icon}</span>
          {title}
        </div>
        <div className={styles.controls}>
          <button className={styles.controlButton} aria-label="Minimize">_</button>
          <button className={styles.controlButton} aria-label="Maximize">□</button>
          <button className={styles.controlButton} aria-label="Close">X</button>
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};