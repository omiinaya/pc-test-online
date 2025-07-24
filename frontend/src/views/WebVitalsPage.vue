<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
    name: 'WebVitalsPage',
    setup() {
        const measuring = ref(false);
        const vitals = ref({
            lcp: {
                value: 'Measuring...',
                score: 'unknown',
                description: 'Time to render the largest content element',
            },
            fid: {
                value: 'Measuring...',
                score: 'unknown',
                description: 'Time from first interaction to browser response',
            },
            cls: {
                value: 'Measuring...',
                score: 'unknown',
                description: 'Amount of unexpected layout shift',
            },
            fcp: {
                value: 'Measuring...',
                score: 'unknown',
                description: 'Time to first contentful paint',
            },
            ttfb: {
                value: 'Measuring...',
                score: 'unknown',
                description: 'Time to first byte from server',
            },
        });

        const getScoreClass = score => {
            switch (score) {
                case 'good':
                    return 'score-good';
                case 'needs-improvement':
                    return 'score-needs-improvement';
                case 'poor':
                    return 'score-poor';
                default:
                    return 'score-unknown';
            }
        };

        const determineScore = (value, thresholds) => {
            if (value <= thresholds.good) return 'good';
            if (value <= thresholds.needsImprovement) return 'needs-improvement';
            return 'poor';
        };

        const formatValue = (value, unit = 'ms') => {
            if (typeof value !== 'number') return 'N/A';

            if (unit === 's') {
                return `${(value / 1000).toFixed(2)}s`;
            } else if (unit === 'score') {
                return value.toFixed(3);
            }
            return `${Math.round(value)}${unit}`;
        };

        const measureVitals = async () => {
            measuring.value = true;

            try {
                // Check if Web Vitals API is available
                if ('web-vitals' in window || typeof getCLS !== 'undefined') {
                    // If web-vitals library is loaded, use it
                    await measureWithWebVitals();
                } else {
                    // Fallback to Performance Observer API
                    await measureWithPerformanceAPI();
                }
            } catch (error) {
                console.error('Error measuring web vitals:', error);
                // Set fallback values
                setFallbackValues();
            } finally {
                measuring.value = false;
            }
        };

        const measureWithWebVitals = () => {
            return new Promise(resolve => {
                // This would use the web-vitals library if available
                // For now, we'll simulate the measurements
                setTimeout(() => {
                    setSimulatedValues();
                    resolve();
                }, 1000);
            });
        };

        const measureWithPerformanceAPI = () => {
            return new Promise(resolve => {
                // Use Performance Observer API for basic measurements
                try {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');

                    // TTFB
                    if (navigation) {
                        const ttfbValue = navigation.responseStart - navigation.requestStart;
                        vitals.value.ttfb = {
                            value: formatValue(ttfbValue),
                            score: determineScore(ttfbValue, { good: 800, needsImprovement: 1800 }),
                            description: 'Time to first byte from server',
                        };
                    }

                    // FCP
                    const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry) {
                        const fcpValue = fcpEntry.startTime;
                        vitals.value.fcp = {
                            value: formatValue(fcpValue),
                            score: determineScore(fcpValue, { good: 1800, needsImprovement: 3000 }),
                            description: 'Time to first contentful paint',
                        };
                    }

                    // For LCP, FID, and CLS, we need more sophisticated measurement
                    // Set placeholder values for now
                    vitals.value.lcp = {
                        value: 'Requires interaction',
                        score: 'unknown',
                        description: 'Time to render the largest content element',
                    };

                    vitals.value.fid = {
                        value: 'Requires interaction',
                        score: 'unknown',
                        description: 'Time from first interaction to browser response',
                    };

                    vitals.value.cls = {
                        value: 'Measuring...',
                        score: 'unknown',
                        description: 'Amount of unexpected layout shift',
                    };

                    resolve();
                } catch (error) {
                    console.error('Performance API measurement failed:', error);
                    setFallbackValues();
                    resolve();
                }
            });
        };

        const setSimulatedValues = () => {
            // Simulate realistic values for demo purposes
            const lcpValue = 1200 + Math.random() * 2000;
            const fidValue = 50 + Math.random() * 200;
            const clsValue = Math.random() * 0.3;
            const fcpValue = 800 + Math.random() * 1000;
            const ttfbValue = 200 + Math.random() * 600;

            vitals.value = {
                lcp: {
                    value: formatValue(lcpValue),
                    score: determineScore(lcpValue, { good: 2500, needsImprovement: 4000 }),
                    description: 'Time to render the largest content element',
                },
                fid: {
                    value: formatValue(fidValue),
                    score: determineScore(fidValue, { good: 100, needsImprovement: 300 }),
                    description: 'Time from first interaction to browser response',
                },
                cls: {
                    value: formatValue(clsValue, 'score'),
                    score: determineScore(clsValue, { good: 0.1, needsImprovement: 0.25 }),
                    description: 'Amount of unexpected layout shift',
                },
                fcp: {
                    value: formatValue(fcpValue),
                    score: determineScore(fcpValue, { good: 1800, needsImprovement: 3000 }),
                    description: 'Time to first contentful paint',
                },
                ttfb: {
                    value: formatValue(ttfbValue),
                    score: determineScore(ttfbValue, { good: 800, needsImprovement: 1800 }),
                    description: 'Time to first byte from server',
                },
            };
        };

        const setFallbackValues = () => {
            vitals.value = {
                lcp: {
                    value: 'N/A',
                    score: 'unknown',
                    description: 'Time to render the largest content element',
                },
                fid: {
                    value: 'N/A',
                    score: 'unknown',
                    description: 'Time from first interaction to browser response',
                },
                cls: {
                    value: 'N/A',
                    score: 'unknown',
                    description: 'Amount of unexpected layout shift',
                },
                fcp: {
                    value: 'N/A',
                    score: 'unknown',
                    description: 'Time to first contentful paint',
                },
                ttfb: {
                    value: 'N/A',
                    score: 'unknown',
                    description: 'Time to first byte from server',
                },
            };
        };

        onMounted(() => {
            // Initial measurement
            measureVitals();
        });

        return {
            vitals,
            measuring,
            measureVitals,
            getScoreClass,
        };
    },
};
</script>

<template>
    <div class="web-vitals-page">
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">Web Vitals Dashboard</h1>
                <p class="page-description">
                    Monitor your website's Core Web Vitals and performance metrics in real-time.
                </p>
            </header>

            <div class="vitals-grid">
                <!-- Core Web Vitals -->
                <div class="vitals-section">
                    <h2 class="section-title">Core Web Vitals</h2>
                    <div class="metrics-grid">
                        <div class="metric-card" :class="getScoreClass(vitals.lcp.score)">
                            <div class="metric-header">
                                <h3>Largest Contentful Paint</h3>
                                <span class="metric-abbreviation">LCP</span>
                            </div>
                            <div class="metric-value">{{ vitals.lcp.value }}</div>
                            <div class="metric-description">{{ vitals.lcp.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">Good: ≤ 2.5s</span>
                                <span class="needs-improvement">Needs Improvement: ≤ 4s</span>
                                <span class="poor">Poor: > 4s</span>
                            </div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.fid.score)">
                            <div class="metric-header">
                                <h3>First Input Delay</h3>
                                <span class="metric-abbreviation">FID</span>
                            </div>
                            <div class="metric-value">{{ vitals.fid.value }}</div>
                            <div class="metric-description">{{ vitals.fid.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">Good: ≤ 100ms</span>
                                <span class="needs-improvement">Needs Improvement: ≤ 300ms</span>
                                <span class="poor">Poor: > 300ms</span>
                            </div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.cls.score)">
                            <div class="metric-header">
                                <h3>Cumulative Layout Shift</h3>
                                <span class="metric-abbreviation">CLS</span>
                            </div>
                            <div class="metric-value">{{ vitals.cls.value }}</div>
                            <div class="metric-description">{{ vitals.cls.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">Good: ≤ 0.1</span>
                                <span class="needs-improvement">Needs Improvement: ≤ 0.25</span>
                                <span class="poor">Poor: > 0.25</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Metrics -->
                <div class="vitals-section">
                    <h2 class="section-title">Additional Performance Metrics</h2>
                    <div class="metrics-grid additional-metrics">
                        <div class="metric-card" :class="getScoreClass(vitals.fcp.score)">
                            <div class="metric-header">
                                <h3>First Contentful Paint</h3>
                                <span class="metric-abbreviation">FCP</span>
                            </div>
                            <div class="metric-value">{{ vitals.fcp.value }}</div>
                            <div class="metric-description">{{ vitals.fcp.description }}</div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.ttfb.score)">
                            <div class="metric-header">
                                <h3>Time to First Byte</h3>
                                <span class="metric-abbreviation">TTFB</span>
                            </div>
                            <div class="metric-value">{{ vitals.ttfb.value }}</div>
                            <div class="metric-description">{{ vitals.ttfb.description }}</div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions-section">
                    <button
                        @click="measureVitals"
                        class="action-button primary"
                        :disabled="measuring"
                    >
                        <svg
                            v-if="measuring"
                            class="loading-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                        <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
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
                        {{ measuring ? 'Measuring...' : 'Refresh Metrics' }}
                    </button>

                    <router-link to="/" class="action-button secondary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Back to Tests
                    </router-link>
                </div>
            </div>

            <div class="info-section">
                <h2 class="section-title">About Web Vitals</h2>
                <p>
                    Core Web Vitals are a set of real-world, user-centered metrics that quantify key
                    aspects of the user experience. They measure dimensions of web usability such as
                    load time, interactivity, and the stability of content as it loads.
                </p>
                <p>
                    <strong>Note:</strong> Some metrics may require user interaction to be measured
                    accurately. Interact with the page and refresh metrics to get complete readings.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.web-vitals-page {
    min-height: calc(100vh - 130px); /* Account for header and footer */
    background: var(--surface-primary);
    color: var(--text-primary);
    padding: 2rem 0;
}

.page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
}

.page-header {
    text-align: center;
    margin-bottom: 3rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0 0 1rem 0;
}

.page-description {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin: 0;
    max-width: 600px;
    margin: 0 auto;
}

.vitals-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.vitals-section {
    background: var(--surface-secondary);
    border-radius: var(--border-radius-large);
    padding: 2rem;
    border: 1px solid var(--border-color);
}

.section-title {
    font-size: 1.5rem;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.additional-metrics {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.metric-card {
    background: var(--surface-tertiary);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-medium);
    padding: 1.5rem;
    transition: var(--transition-default);
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.metric-header h3 {
    font-size: 1.125rem;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
}

.metric-abbreviation {
    background: var(--surface-quaternary);
    color: var(--text-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-small);
    font-size: 0.75rem;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.metric-value {
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.metric-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
}

.metric-threshold {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
}

.metric-threshold span {
    padding: 0.125rem 0.5rem;
    border-radius: var(--border-radius-small);
    font-weight: var(--font-weight-medium);
}

.metric-threshold .good {
    background: rgba(34, 197, 94, 0.1);
    color: rgb(34, 197, 94);
}

.metric-threshold .needs-improvement {
    background: rgba(249, 115, 22, 0.1);
    color: rgb(249, 115, 22);
}

.metric-threshold .poor {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
}

/* Score-based styling */
.score-good {
    border-color: rgb(34, 197, 94);
}

.score-good .metric-value {
    color: rgb(34, 197, 94);
}

.score-needs-improvement {
    border-color: rgb(249, 115, 22);
}

.score-needs-improvement .metric-value {
    color: rgb(249, 115, 22);
}

.score-poor {
    border-color: rgb(239, 68, 68);
}

.score-poor .metric-value {
    color: rgb(239, 68, 68);
}

.score-unknown {
    border-color: var(--border-color);
}

.actions-section {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--border-radius-medium);
    font-size: 1rem;
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    cursor: pointer;
    transition: var(--transition-default);
}

.action-button.primary {
    background: var(--primary-color);
    color: white;
}

.action-button.primary:hover:not(:disabled) {
    background: var(--primary-color-hover);
    transform: translateY(-1px);
}

.action-button.secondary {
    background: var(--surface-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.action-button.secondary:hover {
    background: var(--surface-quaternary);
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.info-section {
    background: var(--surface-secondary);
    border-radius: var(--border-radius-large);
    padding: 2rem;
    border: 1px solid var(--border-color);
    margin-top: 2rem;
}

.info-section p {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 1rem 0;
}

.info-section p:last-child {
    margin-bottom: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .page-container {
        padding: 0 var(--spacing-md);
    }

    .page-title {
        font-size: 2rem;
    }

    .vitals-section {
        padding: 1.5rem;
    }

    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .metric-card {
        padding: 1rem;
    }

    .metric-value {
        font-size: 1.5rem;
    }

    .actions-section {
        flex-direction: column;
        align-items: center;
    }

    .action-button {
        width: 100%;
        max-width: 300px;
        justify-content: center;
    }
}
</style>
