import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  icon?: string;
}

export const RetroWindow = ({ title, children, icon = '🌐' }: RetroWindowProps) => {
  const { t } = useI18n();

  return (
    <div className={`win95-border ${styles.window}`}>
      <div className={styles.titleBar}>
        <div className={styles.titleText}>
          <span>{icon}</span>
          {title}
        </div>
        <div className={styles.controls}>
          <button className={styles.controlButton} aria-label={t.window.minimize}>_</button>
          <button className={styles.controlButton} aria-label={t.window.maximize}>□</button>
          <button className={styles.controlButton} aria-label={t.window.close}>X</button>
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
