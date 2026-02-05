import { createI18n, type I18n, type LocaleMessages } from 'vue-i18n';
import en from '../locales/en.json';
import es from '../locales/es.json';

// Define available locales with type safety
export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'ru' | 'ar';

export interface LocaleInfo {
    code: SupportedLocale;
    name: string;
    nativeName: string;
    dir: 'ltr' | 'rtl';
}

// Available locales with detailed information
export const availableLocales: Record<SupportedLocale, LocaleInfo> = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
    },
    es: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        dir: 'ltr',
    },
    // Additional locales can be added here with proper typing
    fr: {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        dir: 'ltr',
    },
    de: {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        dir: 'ltr',
    },
    zh: {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        dir: 'ltr',
    },
    ja: {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        dir: 'ltr',
    },
    ko: {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        dir: 'ltr',
    },
    ru: {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        dir: 'ltr',
    },
    ar: {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        dir: 'rtl',
    },
};

// Type definitions for messages
export interface AppMessages {
    [key: string]: string | AppMessages;
}

// Create Vue I18n instance with proper typing
const i18n: I18n = createI18n({
    legacy: false, // Use Composition API
    locale: 'en', // Default locale
    fallbackLocale: 'en', // Fallback locale
    messages: {
        en: en as unknown as LocaleMessages<AppMessages>,
        es: es as unknown as LocaleMessages<AppMessages>,
    },
    datetimeFormats: {
        en: {
            short: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            long: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: 'numeric',
                minute: 'numeric',
            },
        },
        es: {
            short: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            long: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: 'numeric',
                minute: 'numeric',
            },
        },
    },
    numberFormats: {
        en: {
            currency: {
                style: 'currency',
                currency: 'USD',
                notation: 'standard',
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
            percent: {
                style: 'percent',
                useGrouping: false,
            },
        },
        es: {
            currency: {
                style: 'currency',
                currency: 'EUR',
                notation: 'standard',
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
            percent: {
                style: 'percent',
                useGrouping: false,
            },
        },
    },
});

// Helper function to change locale with type safety
export const changeLocale = (locale: SupportedLocale): boolean => {
    if (availableLocales[locale]) {
        const localeValue = i18n.global.locale;
        if (typeof localeValue === 'object' && 'value' in localeValue) {
            localeValue.value = locale;
        } else {
            (i18n.global as any).locale = locale;
        }
        // Save to localStorage for persistence
        localStorage.setItem('userLocale', locale);
        return true;
    }
    return false;
};

// Helper function to get current locale
export const getCurrentLocale = (): SupportedLocale => {
    const localeValue = i18n.global.locale;
    if (typeof localeValue === 'object' && 'value' in localeValue) {
        return localeValue.value as SupportedLocale;
    }
    return (i18n.global as any).locale as SupportedLocale;
};

// Helper function to translate with fallback
export const tWithFallback = (key: string, fallback: string): string => {
    try {
        const t = i18n.global.t as any;
        const translated = t(key);
        return translated !== key ? translated : fallback;
    } catch {
        return fallback;
    }
};

// Type-safe translation function
export const translate = (key: string, params?: Record<string, unknown>): string => {
    try {
        const t = i18n.global.t as any;
        return t(key, params) as string;
    } catch {
        return key;
    }
};

// Initialize locale from localStorage or browser language
export const initLocale = (): void => {
    const savedLocale = localStorage.getItem('userLocale') as SupportedLocale | null;
    const browserLocale = navigator.language.split('-')[0] as SupportedLocale; // Get base language

    const localeValue = i18n.global.locale;
    if (typeof localeValue === 'object' && 'value' in localeValue) {
        if (savedLocale && availableLocales[savedLocale]) {
            localeValue.value = savedLocale;
        } else if (availableLocales[browserLocale]) {
            localeValue.value = browserLocale;
        }
    } else {
        if (savedLocale && availableLocales[savedLocale]) {
            (i18n.global as any).locale = savedLocale;
        } else if (availableLocales[browserLocale]) {
            (i18n.global as any).locale = browserLocale;
        }
    }
    // Default to English if no suitable locale found
};

// Get all available locale codes
export const getAvailableLocaleCodes = (): SupportedLocale[] => {
    return Object.keys(availableLocales) as SupportedLocale[];
};

// Get locale information by code
export const getLocaleInfo = (locale: SupportedLocale): LocaleInfo | undefined => {
    return availableLocales[locale];
};

// Check if a locale is RTL
export const isRTL = (locale: SupportedLocale): boolean => {
    return availableLocales[locale]?.dir === 'rtl';
};

export default i18n;
