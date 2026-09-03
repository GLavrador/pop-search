import { useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { useAuth } from '../../context/authContext';
import { useTour } from '../../context/tourContext';
import { Floppy } from '../Assistant';
import styles from './styles.module.css';

interface WelcomeDialogProps {
  onSignIn: () => void;
}

export const WelcomeDialog = ({ onSignIn }: WelcomeDialogProps) => {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const { start, active } = useTour();
  const [closed, setClosed] = useState(false);

  // Waiting for the session to settle avoids a flash of this dialog in front of
  // someone who is already signed in.
  if (isLoading || isAuthenticated || active || closed) return null;

  const choose = (action: () => void) => () => {
    action();
    setClosed(true);
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t.welcome.title}>
      <div className={`win95-border ${styles.dialog}`}>
        <div className={styles.titleBar}>
          <span className={styles.titleText}>{t.welcome.title}</span>
          <button
            type="button"
            className={`win95-btn ${styles.close}`}
            onClick={() => setClosed(true)}
            aria-label={t.welcome.close}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.mascot} aria-hidden="true">
            <Floppy />
          </div>

          <div className={styles.copy}>
            <p className={styles.heading}>{t.welcome.heading}</p>
            <p className={styles.blurb}>{t.welcome.blurb}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={`win95-btn ${styles.primary}`} onClick={choose(start)}>
            {t.welcome.takeTour}
          </button>
          <button type="button" className="win95-btn" onClick={choose(onSignIn)}>
            {t.welcome.signIn}
          </button>
          <button type="button" className="win95-btn" onClick={() => setClosed(true)}>
            {t.welcome.explore}
          </button>
        </div>
      </div>
    </div>
  );
};
