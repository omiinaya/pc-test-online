import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import es from '../locales/es.json';

// Available locales
export const availableLocales = {
  en: 'English',
  es: 'Español',
  // Additional locales can be added here
  // fr: 'Français',
  // de: 'Deutsch',
  // zh: '中文',
  // ja: '日本語',
  // ko: '한국어',
  // ru: 'Русский',
  // ar: 'العربية'
};

// Create Vue I18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'en', // Default locale
  fallbackLocale: 'en', // Fallback locale
  messages: {
    en,
    es
  },
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    es: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      es: {
        currency: {
          style: 'currency',
          currency: 'EUR',
          notation: 'standard'
        },
        decimal: {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        percent: {
          style: 'percent',
          useGrouping: false
        }
      }
    }
  },
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    }
  }
});

// Helper function to change locale
export const changeLocale = (locale) => {
  if (availableLocales[locale]) {
    i18n.global.locale.value = locale;
    // Save to localStorage for persistence
    localStorage.setItem('userLocale', locale);
    return true;
  }
  return false;
};

// Helper function to get current locale
export const getCurrentLocale = () => {
  return i18n.global.locale.value;
};

// Helper function to translate with fallback
export const tWithFallback = (key, fallback) => {
  const translated = i18n.global.t(key);
  return translated !== key ? translated : fallback;
};

// Initialize locale from localStorage or browser language
export const initLocale = () => {
  const savedLocale = localStorage.getItem('userLocale');
  const browserLocale = navigator.language.split('-')[0]; // Get base language
  
  if (savedLocale && availableLocales[savedLocale]) {
    i18n.global.locale.value = savedLocale;
  } else if (availableLocales[browserLocale]) {
    i18n.global.locale.value = browserLocale;
  }
  // Default to English if no suitable locale found
};

export default i18n;