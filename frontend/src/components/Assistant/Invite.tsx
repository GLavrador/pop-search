import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import styles from './styles.module.css';

interface GuideInviteProps {
  onStart: () => void;
  onDismiss: () => void;
}

export const GuideInvite = ({ onStart, onDismiss }: GuideInviteProps) => {
  const { t } = useI18n();

  return (
    <div className={`win95-border ${styles.invite}`}>
      <span className={styles.mini} data-pose="wave" data-face="happy">
        <Robot className={styles.robotSmall} />
      </span>
      <span className={styles.inviteText}>{t.guide.invite.text}</span>
      <button type="button" className={`win95-btn ${styles.inviteStart}`} onClick={onStart}>
        {t.guide.invite.start}
      </button>
      <button
        type="button"
        className={styles.control}
        title={t.guide.invite.dismissTitle}
        aria-label={t.guide.invite.dismissTitle}
        onClick={onDismiss}
      >
        {t.guide.invite.dismiss}
      </button>
    </div>
  );
};
