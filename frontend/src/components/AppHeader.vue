<script>
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from './LanguageSwitcher.vue';

export default {
    name: 'AppHeader',
    components: {
        LanguageSwitcher
    },
    setup() {
        const { t } = useI18n();
        return { t };
    },
};
</script>

<template>
    <header class="app-header">
        <div class="header-content">
            <div class="header-left">
                <div class="brand-section">
                    <div class="brand-icon">
                        <img
                            src="/favicon.svg"
                            :alt="t('app.name') + ' Icon'"
                            style="width: 28px; height: 28px"
                        />
                    </div>
                    <h1 class="brand-title">{{ t('app.name') }}</h1>
                </div>
            </div>

            <nav class="header-nav">
                <div class="nav-links">
                    <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
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
                            <path d="M9 12l2 2 4-4" />
                            <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
                            <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
                            <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
                            <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
                        </svg>
                        {{ t('navigation.tests') }}
                    </router-link>

                    <router-link
                        to="/about"
                        class="nav-link"
                        :class="{ active: $route.path === '/about' }"
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {{ t('navigation.about') }}
                    </router-link>
                </div>
            </nav>

            <div class="header-right">
                <div class="status-indicator-group">
                    <LanguageSwitcher class="language-switcher-wrapper" />
                    <a
                        href="https://github.com/omiinaya/pc-test-online"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="github-link"
                        :title="t('ui.view_source_code')"
                    >
                        <div class="github-icon">
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
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--surface-secondary);
    border-bottom: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
    z-index: 1001; /* Higher than footer */
    padding: 0.75rem 0;
    height: 60px;
    box-sizing: border-box;
}

.header-content {
    max-width: 100%;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    position: relative;
}

.header-left {
    display: flex;
    align-items: center;
    z-index: 2;
}

.brand-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.header-nav {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    z-index: 1;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    padding: 0.5rem 0.75rem;
    border-radius: var(--border-radius-medium);
    transition: all var(--transition-default);
    position: relative;
}

.nav-link:hover {
    color: var(--text-primary);
    background: rgba(var(--primary-color-rgb), 0.1);
    transform: translateY(-1px);
}

.nav-link.active {
    color: var(--primary-color);
    background: rgba(var(--primary-color-rgb), 0.15);
    font-weight: var(--font-weight-semibold);
}

.nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 2px;
    background: var(--primary-color);
    border-radius: 1px;
}

.nav-link svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 2;
}

.status-indicator-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.language-switcher-wrapper {
    display: flex;
    align-items: center;
}

.connection-status {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid;
    transition: all var(--transition-default);
}

.connection-status.online {
    color: var(--success-color);
    border-color: var(--success-color);
    background: rgba(34, 197, 94, 0.1);
}

.connection-status.offline {
    color: var(--danger-color);
    border-color: var(--danger-color);
    background: rgba(239, 68, 68, 0.1);
}

.connection-status svg {
    width: 12px;
    height: 12px;
    stroke: currentColor;
}

.github-link {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: inherit;
    transition: all var(--transition-default);
}

.github-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--text-tertiary);
    color: var(--text-tertiary);
    background: transparent;
    transition: all var(--transition-default);
}

.github-link:hover .github-icon {
    color: var(--text-primary);
    border-color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
}

.github-link:hover {
    opacity: 1;
}

/* Language Switcher styling to match header design - now round like GitHub button */
.language-switcher-wrapper :deep(.language-switcher__trigger) {
    background: transparent;
    border: 2px solid var(--text-tertiary);
    color: var(--text-tertiary);
    width: 32px;
    height: 32px;
    padding: 0;
    min-width: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.language-switcher-wrapper :deep(.language-switcher__trigger:hover) {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-color: var(--text-primary);
}

.language-switcher-wrapper :deep(.language-switcher__flag) {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translateY(0.5px); /* Fine-tune emoji vertical alignment */
    color: var(--text-primary); /* Make globe icon white */
    filter: brightness(0) invert(1); /* Ensure it's white regardless of emoji color */
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .header-content {
        padding: 0 var(--spacing-md);
    }

    .nav-links {
        gap: 1rem;
    }

    .nav-link {
        padding: 0.375rem 0.5rem;
        gap: 0.375rem;
        font-size: var(--font-size-xs);
    }

    .nav-link svg {
        width: 14px;
        height: 14px;
    }

    .brand-title {
        font-size: 1.25rem;
    }

    .brand-section {
        gap: 0.5rem;
    }
}

/* Extra small screens - hide text, show only icons */
@media (max-width: 640px) {
    .nav-link span:not(.sr-only) {
        display: none;
    }

    .nav-links {
        gap: 0.5rem;
    }

    .nav-link {
        padding: 0.5rem;
        min-width: 32px;
        justify-content: center;
    }

    .language-switcher-wrapper :deep(.language-switcher__trigger) {
        width: 32px;
        height: 32px;
        padding: 0;
    }
    
    .language-switcher-wrapper :deep(.language-switcher__flag) {
        font-size: 1.1rem;
        transform: translateY(0.25px); /* Slightly less adjustment on mobile */
    }
}

/* Tablet landscape and smaller */
@media (max-width: 1024px) {
    .header-right {
        gap: 0.5rem;
    }

    .status-indicator-group {
        gap: 0.5rem;
    }
}
</style>
