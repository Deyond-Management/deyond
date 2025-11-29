/**
 * i18n Configuration
 * Internationalization setup using i18n-js and expo-localization
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import ko from './locales/ko.json';

// Create i18n instance
const i18n = new I18n({
  en,
  ko,
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';

// Enable fallback if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;

// Helper function to change language
export const setLanguage = (languageCode: string) => {
  i18n.locale = languageCode;
};

// Helper function to get current language
export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

// Helper function to get available languages
export const getAvailableLanguages = (): Array<{ code: string; name: string }> => {
  return [
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
  ];
};
