<script>
export default {
    name: 'AppFooter',
    props: {
        showExportMenu: {
            type: Boolean,
            default: false
        },
        completedTests: {
            type: Number,
            default: 0
        },
        totalTests: {
            type: Number,
            default: 7
        }
    },
    methods: {
        handleBuiltWithClick() {
            // Placeholder for future "built with" link
            // console.log('Built with link clicked - will be implemented later');
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
                <!-- Left section - Buy Me Coffee link -->
                <div class="footer-grid-column footer-grid-left">
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
                        {{ $t('footer.buyMeCoffee') }}
                    </a>
                </div>
                
                <!-- Center section - Reset button, Progress indicator, and Export button -->
                <div class="footer-grid-column footer-grid-center">
                    <div class="footer-links">
                        <button
                            @click="handleReset"
                            class="button button--secondary button--small"
                            :title="$t('footer.resetTests')"
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
                            <span>{{ $t('buttons.reset') }}</span>
                        </button>
              
                        <span class="footer-progress">
                            {{ completedTests }}/{{ totalTests }}
                        </span>
              
                        <div class="export-menu-footer">
                            <button
                                @click="handleToggleExport"
                                class="button button--primary button--small"
                                :title="$t('footer.exportResults')"
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
                                <span>{{ $t('buttons.export') }}</span>
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
                                        {{ $t('buttons.exportPdf') }}
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
                                        {{ $t('buttons.exportJson') }}
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
                                        {{ $t('buttons.exportCsv') }}
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>
                
                <!-- Right section - Social media links -->
                <div class="footer-grid-column footer-grid-right">
                    <span class="follow-text">Follow me on: </span>
                    <div class="social-links">
                        <!-- X (Twitter) -->
                        <a
                            href="https://x.com/omiinaya"
                            class="footer-link social-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Follow on X (Twitter)"
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
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        
                        <!-- GitHub -->
                        <a
                            href="https://github.com/omiinaya"
                            class="footer-link social-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View GitHub profile"
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
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                            </svg>
                        </a>
                        
                        <!-- LinkedIn -->
                        <a
                            href="https://www.linkedin.com/in/omiinaya/"
                            class="footer-link social-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Connect on LinkedIn"
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
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                                <rect x="2" y="9" width="4" height="12"/>
                                <circle cx="4" cy="4" r="2"/>
                            </svg>
                        </a>
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
    gap: 1rem;
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

/* Follow text styling */
.follow-text {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    margin-right: 0.5rem;
}

/* Social links styling */
.social-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.footer-link.social-link {
    padding: 0.5rem;
    border-radius: var(--border-radius-medium);
    transition: all var(--transition-default);
}

.footer-link.social-link:hover {
    background: rgba(var(--primary-color-rgb), 0.1);
    transform: translateY(-1px);
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

/* Social link hover colors */
.footer-link.social-link:nth-child(1):hover {
    color: #000000;
    background: rgba(0, 0, 0, 0.1);
}

.footer-link.social-link:nth-child(2):hover {
    color: #6e5494;
    background: rgba(110, 84, 148, 0.1);
}

.footer-link.social-link:nth-child(3):hover {
    color: #0077b5;
    background: rgba(0, 119, 181, 0.1);
}


/* Progress tracker styling */
.footer-progress {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    padding: 0.5rem 0.75rem;
    border-radius: var(--border-radius-medium);
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    transition: all var(--transition-default);
}

.footer-progress:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
    transform: translateY(-1px);
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
        gap: 0.75rem;
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
    
    .footer-grid-right {
        justify-content: flex-end;
    }
}
</style>
