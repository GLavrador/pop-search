import { useI18n } from '../../i18n/languageContext';
import { CONTACT_URL } from '../../constants/contact';
import { Dialog } from '../Dialog';
import styles from './styles.module.css';

interface ReviewWelcomeProps {
  /** The AI analyses the account has before it is approved. */
  analyses: number;
  onClose: () => void;
  /** Shown on the first visit, it is closed only by its button. */
  required?: boolean;
}

/** How the review of a new account works, and where to ask for approval. */
export const ReviewWelcome = ({ analyses, onClose, required = false }: ReviewWelcomeProps) => {
  const { t } = useI18n();
  const copy = t.underReview;

  return (
    <Dialog title={copy.title} onClose={onClose} required={required} okLabel={copy.ok}>
      <p className={styles.text}>{copy.intro}</p>
      <ul className={styles.points}>
        <li>{copy.oneVideo}</li>
        <li>{copy.analyses(analyses)}</li>
        <li>{copy.private}</li>
        <li>{copy.locks}</li>
      </ul>
      <p className={styles.text}>
        {copy.contact}{' '}
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
          {CONTACT_URL.replace(/^https:\/\/www\./, '')}
        </a>
      </p>
      <p className={styles.text}>{copy.after}</p>
    </Dialog>
  );
};
