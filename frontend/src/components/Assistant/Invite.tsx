import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import { Robot } from './Robot';
import styles from './styles.module.css';

interface GuideInviteProps {
  /** True once the visitor has opened the guide before, so it stops saying "first time". */
  returning: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

export const GuideInvite = ({ returning, onStart, onDismiss }: GuideInviteProps) => {
  const { t } = useI18n();
  const copy = returning ? t.guide.invite.again : t.guide.invite.fresh;

  return (
    <div
      className={`${styles.invite} ${returning ? '' : styles.inviteFresh}`}
      {...helpAt('guide.invite')}
    >
      <span className={styles.mini} data-pose="wave" data-face="happy">
        <Robot className={styles.robotMedium} />
      </span>
      <span className={styles.inviteText}>
        <strong className={styles.inviteLead}>{copy.lead}</strong> {copy.text}
      </span>
      <button type="button" className={`win95-btn ${styles.go}`} onClick={onStart}>
        {copy.start}
      </button>
      <button
        type="button"
        className={styles.close}
        title={t.guide.invite.dismissTitle}
        aria-label={t.guide.invite.dismissTitle}
        onClick={onDismiss}
      />
    </div>
  );
};
