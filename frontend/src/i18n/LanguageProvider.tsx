import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DICTIONARIES,
  I18nContext,
  LANGUAGE_STORAGE_KEY,
  LOCALES,
  detectLanguage,
  type I18nContextType,
  type Language,
} from './languageContext';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = LOCALES[language];
  }, [language]);

  const value = useMemo<I18nContextType>(() => ({
    language,
    locale: LOCALES[language],
    t: DICTIONARIES[language],
    setLanguage: (next) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      setLanguageState(next);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
