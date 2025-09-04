<script>
export default {
    name: 'AppFooter',
    props: {
        showExportMenu: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        handleBuiltWithClick() {
            // Placeholder for future "built with" link
            console.log('Built with link clicked - will be implemented later');
        },
        handleReset() {
            this.$emit('reset-tests');
        },
        handleToggleExport() {
            this.$emit('toggle-export-menu');
        },
        handleExportPdf() {
            this.$emit('export-pdf');
        },
        handleExportJson() {
            this.$emit('export-json');
        },
        handleExportCsv() {
            this.$emit('export-csv');
        }
    },
};
</script>

<template>
    <footer class="app-footer">
        <div class="footer-content">
            <div class="footer-grid">
                <!-- Left section (can be used for future content) -->
                <div class="footer-grid-column footer-grid-left"></div>
                
                <!-- Center section (existing footer links) -->
                <div class="footer-grid-column footer-grid-center">
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
                
                <!-- Right section for action buttons -->
                <div class="footer-grid-column footer-grid-right">
                    <div class="footer-action-buttons">
                        <button
                            @click="handleReset"
                            class="button button--secondary button--small"
                            title="Reset Tests"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                            <span>Reset</span>
                        </button>
                        <div class="export-menu-footer">
                            <button
                                @click="handleToggleExport"
                                class="button button--primary button--small"
                                title="Export Report"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>Export</span>
                            </button>
                            <transition name="expand-fade">
                                <div v-if="showExportMenu" class="export-options-footer">
                                    <button @click="handleExportPdf" class="button button--text export-option-footer">
                                        <svg
                                            class="export-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                        >
                                            <path
                                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                            ></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        Export as PDF
                                    </button>
                                    <button @click="handleExportJson" class="button button--text export-option-footer">
                                        <svg
                                            class="export-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                        >
                                            <path
                                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                            ></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <path d="M12 18v-6"></path>
                                            <circle cx="12" cy="18" r="1"></circle>
                                        </svg>
                                        Export as JSON
                                    </button>
                                    <button @click="handleExportCsv" class="button button--text export-option-footer">
                                        <svg
                                            class="export-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                        >
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 1-2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <path d="M8 12h8"></path>
                                            <path d="M8 16h8"></path>
                                        </svg>
                                        Export as CSV
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>
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
    z-index: 9999;
    padding: 0.75rem 0;
}

.footer-content {
    width: 100%;
    padding: 0 var(--spacing-md);
}

.footer-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.footer-grid-column {
    display: flex;
    align-items: center;
}

.footer-grid-left,
.footer-grid-center,
.footer-grid-right {
    display: flex;
    align-items: center;
}

.footer-grid-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

.footer-grid-right {
    margin-left: auto;
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

/* Footer Action Buttons */
.footer-action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.export-menu-footer {
    position: relative;
}

.export-options-footer {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 0.5rem;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(8px);
    min-width: 140px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    z-index: 100;
}

.export-option-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 0.8rem;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.export-option-footer:hover {
    background: rgba(255, 255, 255, 0.1);
}

.export-option-footer .export-icon {
    flex-shrink: 0;
    opacity: 0.7;
}

/* Transition animations */
.expand-fade-enter-active,
.expand-fade-leave-active {
    transition: all 0.2s ease;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.expand-fade-enter-to,
.expand-fade-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .footer-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .footer-grid-column:first-child,
    .footer-grid-column:last-child {
        display: none;
    }

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

    .footer-action-buttons {
        justify-content: center;
        width: 100%;
    }
}

/* Desktop-specific footer positioning */
@media (min-width: 769px) {
    .footer-action-buttons {
        position: relative;
        right: 0;
    }
}
</style>
