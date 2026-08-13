import { createContext, useContext } from 'react';
import { en, type Dictionary } from './en';
import { pt } from './pt';

export type Language = 'pt' | 'en';

export const LANGUAGES: readonly Language[] = ['pt', 'en'];

export const DICTIONARIES: Record<Language, Dictionary> = { pt, en };

export const LOCALES: Record<Language, string> = { pt: 'pt-BR', en: 'en-US' };

export const LANGUAGE_STORAGE_KEY = 'pop-search:language';

const isLanguage = (value: unknown): value is Language =>
  value === 'pt' || value === 'en';

export const detectLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(stored)) {
    return stored;
  }

  const browser = navigator.language?.toLowerCase() ?? '';
  if (!browser) return 'pt';
  return browser.startsWith('pt') ? 'pt' : 'en';
};

export interface I18nContextType {
  language: Language;
  locale: string;
  t: Dictionary;
  setLanguage: (language: Language) => void;
}

// Defaulted, not undefined: a component without the provider still reads text.
export const I18nContext = createContext<I18nContextType>({
  language: 'en',
  locale: LOCALES.en,
  t: en,
  setLanguage: () => {},
});

export const useI18n = () => useContext(I18nContext);
