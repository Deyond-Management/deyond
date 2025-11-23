/**
 * i18n Configuration
 * Internationalization setup using react-i18next
 * NOTE: Requires i18next and react-i18next packages to be installed
 */

// Get device language using expo-localization
import { getLocales } from 'expo-localization';

// Get device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

// Placeholder export until i18next is installed
export default {
  t: (key: string) => key,
  language: deviceLanguage,
};
