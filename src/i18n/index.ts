import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷', currency: 'BRL' },
  { code: 'en-US', label: 'English', flag: '🇺🇸', currency: 'USD' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸', currency: 'EUR' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷', currency: 'EUR' }
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
      'fr-FR': { translation: frFR }
    },
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
