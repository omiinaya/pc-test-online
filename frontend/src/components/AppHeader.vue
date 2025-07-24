<script>
export default {
    name: 'AppHeader',
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
                            alt="MMIT Lab Icon"
                            style="width: 28px; height: 28px"
                        />
                    </div>
                    <h1 class="brand-title">MMIT Lab</h1>
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
                        Tests
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
                        About
                    </router-link>
                </div>
            </nav>

            <div class="header-right">
                <div class="status-indicator-group">
                    <div class="connection-status online" title="Online">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <line x1="12" y1="20" x2="12.01" y2="20" />
                        </svg>
                    </div>
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
    gap: 1rem;
    z-index: 2;
}

.status-indicator-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
}

/* Tablet landscape and smaller */
@media (max-width: 1024px) {
    .header-right {
        gap: 0.5rem;
    }
}
</style>
