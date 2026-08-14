import { useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

interface CatRevealProps {
  image: string;
  phrase: string;
}

export const CatReveal = ({ image, phrase }: CatRevealProps) => {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);

  return (
    <div className={`${styles.reveal} ${ready ? styles.ready : ''}`} role="status">
      <div className={`win95-border ${styles.frame}`}>
        <img
          src={image}
          alt={t.closed.catAlt}
          className={styles.cat}
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
        />
      </div>
      <p className={styles.phrase}>{phrase}</p>
      <p className={styles.hint}>{t.closed.hint}</p>
    </div>
  );
};
