import { useI18n, type Language } from '../../i18n/languageContext';
import styles from './styles.module.css';

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useI18n();

  const options: { id: Language; label: string; title: string }[] = [
    { id: 'pt', label: t.language.pt, title: t.language.ptTitle },
    { id: 'en', label: t.language.en, title: t.language.enTitle },
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t.language.label}</span>

      <div className={styles.buttonGroup} role="group" aria-label={t.language.label}>
        {options.map(({ id, label, title }) => (
          <button
            key={id}
            type="button"
            lang={id}
            title={title}
            aria-pressed={language === id}
            onClick={() => setLanguage(id)}
            className={`win95-btn ${styles.button} ${language === id ? 'win95-btn-pressed' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
