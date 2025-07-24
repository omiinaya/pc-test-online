<script>
export default {
    name: 'AppFooter',
    methods: {
        handleBuiltWithClick() {
            // Placeholder for future "built with" link
            console.log('Built with link clicked - will be implemented later');
        },
    },
};
</script>

<template>
    <footer class="app-footer">
        <div class="footer-content">
            <div class="footer-links">
                <a
                    href="https://buymeacoffee.com/omiinaya"
                    class="footer-link coffee"
                    target="_blank"
                    rel="noopener noreferrer"
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
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                    Buy me a coffee
                </a>

                <a href="#" class="footer-link built-with" @click.prevent="handleBuiltWithClick">
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
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                        <line x1="16" y1="8" x2="2" y2="22" />
                        <line x1="17.5" y1="15" x2="9" y2="15" />
                    </svg>
                    Built with ❤️
                </a>

                <router-link to="/web-vitals" class="footer-link vitals">
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
                        <path d="M3 3v5h5" />
                        <path d="M6 17l4-4 4 4" />
                        <path d="M18 21v-5h-5" />
                        <path d="M3 16.5L12 12l5.5 4" />
                    </svg>
                    Web Vitals
                </router-link>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.app-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface-secondary);
    border-top: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 0.75rem 0;
}

.footer-content {
    max-width: var(--container-max-width);
    margin: 0 auto;
    padding: 0 var(--spacing-md);
}

.footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.footer-link {
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

.footer-link:hover {
    color: var(--text-primary);
    background: rgba(var(--primary-color-rgb), 0.1);
    transform: translateY(-1px);
}

.footer-link svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
}

/* Specific link styling */
.footer-link.built-with:hover {
    color: #e11d48;
    background: rgba(225, 29, 72, 0.1);
}

.footer-link.coffee:hover {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
}

.footer-link.vitals:hover {
    color: var(--primary-color);
    background: rgba(var(--primary-color-rgb), 0.1);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .footer-links {
        gap: 1rem;
        font-size: var(--font-size-xs);
    }

    .footer-link {
        padding: 0.375rem 0.5rem;
        gap: 0.375rem;
    }

    .footer-link svg {
        width: 14px;
        height: 14px;
    }
}
</style>
