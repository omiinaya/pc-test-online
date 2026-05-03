<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { availableLocales, changeLocale, getCurrentLocale, type SupportedLocale } from '../i18n';
import { useTheme, type ThemeMode } from '../composables/useTheme';

type MenuLevel = 'main' | 'account' | 'language' | 'theme';

export default defineComponent({
    name: 'AvatarDropdown',
    emits: ['logout'],
    setup(_, { emit }) {
        const { t } = useI18n();
        const { theme, setTheme } = useTheme();

        const isOpen = ref(false);
        const currentMenu = ref<MenuLevel>('main');
        const currentLocale = ref<SupportedLocale>(getCurrentLocale());

        const localeNames: Record<SupportedLocale, string> = {
            en: 'English',
            es: 'Español',
            fr: 'Français',
            de: 'Deutsch',
            zh: '中文',
            ja: '日本語',
            ko: '한국어',
            ru: 'Русский',
            ar: 'العربية',
        };

        const supportedLocalesForMenu: SupportedLocale[] = ['en', 'es'];

        const toggleDropdown = () => {
            isOpen.value = !isOpen.value;
            if (isOpen.value) {
                currentMenu.value = 'main';
            }
        };

        const closeDropdown = () => {
            isOpen.value = false;
            currentMenu.value = 'main';
        };

        const navigateTo = (menu: MenuLevel) => {
            currentMenu.value = menu;
        };

        const goBack = () => {
            currentMenu.value = 'main';
        };

        const changeLanguage = (locale: SupportedLocale) => {
            const success = changeLocale(locale);
            if (success) {
                currentLocale.value = locale;
                closeDropdown();
            }
        };

        const changeTheme = (newTheme: ThemeMode) => {
            setTheme(newTheme);
            closeDropdown();
        };

        const handleLogout = () => {
            localStorage.clear();
            sessionStorage.clear();
            emit('logout');
            closeDropdown();
            // Reload page to reset app state
            window.location.reload();
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const dropdownEl = document.querySelector('.avatar-dropdown');
            if (dropdownEl && !dropdownEl.contains(target)) {
                closeDropdown();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (currentMenu.value !== 'main') {
                    goBack();
                } else {
                    closeDropdown();
                }
            }
        };

        onMounted(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        });

        const menuTitle = computed(() => {
            switch (currentMenu.value) {
                case 'account':
                    return t('ui.account');
                case 'language':
                    return t('ui.selectLanguage');
                case 'theme':
                    return t('ui.selectTheme');
                default:
                    return t('ui.userMenu');
            }
        });

        return {
            t,
            isOpen,
            currentMenu,
            currentLocale,
            theme,
            localeNames,
            supportedLocalesForMenu,
            availableLocales,
            toggleDropdown,
            closeDropdown,
            navigateTo,
            goBack,
            changeLanguage,
            changeTheme,
            handleLogout,
            menuTitle,
        };
    },
});
</script>

<template>
    <div class="avatar-dropdown">
        <button
            class="avatar-dropdown__trigger"
            @click.stop="toggleDropdown"
            :title="t('ui.userMenu')"
            :aria-expanded="isOpen"
            aria-haspopup="true"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        </button>

        <transition name="fade-slide">
            <div v-if="isOpen" class="avatar-dropdown__menu">
                <!-- Menu Header -->
                <div class="avatar-dropdown__header">
                    <button
                        v-if="currentMenu !== 'main'"
                        class="avatar-dropdown__back"
                        @click="goBack"
                        :title="t('ui.back')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span class="avatar-dropdown__title">{{ menuTitle }}</span>
                    <button
                        class="avatar-dropdown__close"
                        @click="closeDropdown"
                        :title="t('ui.close')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <!-- Main Menu -->
                <div v-if="currentMenu === 'main'" class="avatar-dropdown__items">
                    <button class="avatar-dropdown__item" @click="navigateTo('account')">
                        <span class="avatar-dropdown__icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.account') }}</span>
                        <span class="avatar-dropdown__arrow">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </span>
                    </button>

                    <button class="avatar-dropdown__item" @click="navigateTo('language')">
                        <span class="avatar-dropdown__icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path
                                    d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.language') }}</span>
                        <span class="avatar-dropdown__arrow">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </span>
                    </button>

                    <button class="avatar-dropdown__item" @click="navigateTo('theme')">
                        <span class="avatar-dropdown__icon">
                            <svg
                                v-if="theme === 'dark'"
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                            <svg
                                v-else
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.theme') }}</span>
                        <span class="avatar-dropdown__arrow">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </span>
                    </button>

                    <div class="avatar-dropdown__divider"></div>

                    <button
                        class="avatar-dropdown__item avatar-dropdown__item--danger"
                        @click="handleLogout"
                    >
                        <span class="avatar-dropdown__icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.logout') }}</span>
                    </button>
                </div>

                <!-- Account Submenu -->
                <div v-else-if="currentMenu === 'account'" class="avatar-dropdown__items">
                    <div class="avatar-dropdown__coming-soon">
                        <div class="avatar-dropdown__coming-soon-icon">🔒</div>
                        <div class="avatar-dropdown__coming-soon-title">{{ t('ui.password') }}</div>
                        <div class="avatar-dropdown__coming-soon-text">
                            {{ t('ui.comingSoon') }}
                        </div>
                    </div>
                    <div class="avatar-dropdown__divider"></div>
                    <div class="avatar-dropdown__coming-soon">
                        <div class="avatar-dropdown__coming-soon-icon">🔐</div>
                        <div class="avatar-dropdown__coming-soon-title">
                            {{ t('ui.twoFactorAuth') }}
                        </div>
                        <div class="avatar-dropdown__coming-soon-text">
                            {{ t('ui.comingSoon') }}
                        </div>
                    </div>
                </div>

                <!-- Language Submenu -->
                <div v-else-if="currentMenu === 'language'" class="avatar-dropdown__items">
                    <button
                        v-for="locale in supportedLocalesForMenu"
                        :key="locale"
                        class="avatar-dropdown__item"
                        :class="{ 'avatar-dropdown__item--active': locale === currentLocale }"
                        @click="changeLanguage(locale)"
                    >
                        <span class="avatar-dropdown__icon avatar-dropdown__icon--code">
                            {{ locale.toUpperCase() }}
                        </span>
                        <span class="avatar-dropdown__label">{{ localeNames[locale] }}</span>
                        <span v-if="locale === currentLocale" class="avatar-dropdown__check">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                    </button>
                </div>

                <!-- Theme Submenu -->
                <div v-else-if="currentMenu === 'theme'" class="avatar-dropdown__items">
                    <button
                        class="avatar-dropdown__item"
                        :class="{ 'avatar-dropdown__item--active': theme === 'dark' }"
                        @click="changeTheme('dark')"
                    >
                        <span class="avatar-dropdown__icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.darkMode') }}</span>
                        <span v-if="theme === 'dark'" class="avatar-dropdown__check">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                    </button>
                    <button
                        class="avatar-dropdown__item"
                        :class="{ 'avatar-dropdown__item--active': theme === 'light' }"
                        @click="changeTheme('light')"
                    >
                        <span class="avatar-dropdown__icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        </span>
                        <span class="avatar-dropdown__label">{{ t('ui.lightMode') }}</span>
                        <span v-if="theme === 'light'" class="avatar-dropdown__check">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.avatar-dropdown {
    position: relative;
    display: inline-block;
}

.avatar-dropdown__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--text-tertiary);
    color: var(--text-tertiary);
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-default);
    padding: 0;
}

.avatar-dropdown__trigger:hover {
    color: var(--text-primary);
    border-color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
}

.avatar-dropdown__menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: var(--surface-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-large);
    box-shadow: var(--shadow-large);
    min-width: 220px;
    z-index: 1000;
    overflow: hidden;
}

.avatar-dropdown__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--surface-secondary);
}

.avatar-dropdown__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    flex: 1;
    text-align: center;
}

.avatar-dropdown__back,
.avatar-dropdown__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-default);
    padding: 0;
    flex-shrink: 0;
}

.avatar-dropdown__back:hover,
.avatar-dropdown__close:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
}

.avatar-dropdown__items {
    padding: 0.5rem 0;
}

.avatar-dropdown__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-default);
    text-align: left;
    font-family: inherit;
}

.avatar-dropdown__item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.avatar-dropdown__item--active {
    color: var(--primary-color);
}

.avatar-dropdown__item--active .avatar-dropdown__label {
    color: var(--primary-color);
}

.avatar-dropdown__item--danger {
    color: var(--danger-color);
}

.avatar-dropdown__item--danger .avatar-dropdown__icon {
    color: var(--danger-color);
}

.avatar-dropdown__item--danger:hover {
    background: rgba(220, 53, 69, 0.1);
}

.avatar-dropdown__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--text-tertiary);
}

.avatar-dropdown__icon--code {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--text-secondary);
}

.avatar-dropdown__label {
    flex: 1;
    color: inherit;
}

.avatar-dropdown__arrow {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    flex-shrink: 0;
}

.avatar-dropdown__check {
    display: flex;
    align-items: center;
    color: var(--primary-color);
    flex-shrink: 0;
}

.avatar-dropdown__divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.5rem 0;
}

.avatar-dropdown__coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    text-align: center;
    gap: 0.25rem;
}

.avatar-dropdown__coming-soon-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
}

.avatar-dropdown__coming-soon-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.avatar-dropdown__coming-soon-text {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all var(--transition-default);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .avatar-dropdown__menu {
        right: -50px;
        min-width: 200px;
    }
}

@media (max-width: 640px) {
    .avatar-dropdown__menu {
        right: -80px;
    }
}
</style>
