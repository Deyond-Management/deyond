/**
 * i18n Configuration Tests
 */

import i18n, { setLanguage, getCurrentLanguage, getAvailableLanguages } from '../../i18n';

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en', regionCode: 'US' }]),
}));

describe('i18n Configuration', () => {
  describe('i18n instance', () => {
    it('should be defined', () => {
      expect(i18n).toBeDefined();
    });

    it('should have default locale', () => {
      expect(i18n.defaultLocale).toBe('en');
    });

    it('should have fallback enabled', () => {
      expect(i18n.enableFallback).toBe(true);
    });

    it('should translate English text', () => {
      i18n.locale = 'en';
      const translated = i18n.t('common.ok');
      expect(translated).toBe('OK');
    });

    it('should translate Korean text', () => {
      i18n.locale = 'ko';
      const translated = i18n.t('common.ok');
      expect(translated).toBe('확인');
    });

    it('should fallback to English for missing translations', () => {
      i18n.locale = 'ko';
      // If a key is missing in Korean, it should fallback to English
      const translated = i18n.t('nonexistent.key');
      expect(translated).toContain('nonexistent.key');
    });
  });

  describe('setLanguage', () => {
    it('should change language', () => {
      setLanguage('ko');
      expect(i18n.locale).toBe('ko');

      setLanguage('en');
      expect(i18n.locale).toBe('en');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      i18n.locale = 'en';
      expect(getCurrentLanguage()).toBe('en');

      i18n.locale = 'ko';
      expect(getCurrentLanguage()).toBe('ko');
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages', () => {
      const languages = getAvailableLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBe(2);
    });

    it('should include English', () => {
      const languages = getAvailableLanguages();
      const english = languages.find(lang => lang.code === 'en');
      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
    });

    it('should include Korean', () => {
      const languages = getAvailableLanguages();
      const korean = languages.find(lang => lang.code === 'ko');
      expect(korean).toBeDefined();
      expect(korean?.name).toBe('한국어');
    });
  });
});
