import { ref, readonly } from 'vue';

export type ThemeMode = 'dark' | 'light';

const currentTheme = ref<ThemeMode>('dark');

const THEME_STORAGE_KEY = 'userTheme';

export function useTheme() {
    const setTheme = (theme: ThemeMode) => {
        currentTheme.value = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
            document.documentElement.classList.remove('dark-theme');
        } else {
            document.documentElement.classList.add('dark-theme');
            document.documentElement.classList.remove('light-theme');
        }
    };

    const toggleTheme = () => {
        setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    };

    return {
        theme: readonly(currentTheme),
        setTheme,
        toggleTheme,
        initTheme,
    };
}

export default useTheme;
