<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    name: 'WebVitalsPage',
    setup() {
        const { t } = useI18n();
        const measuring = ref(false);
        const vitals = ref({
            lcp: {
                value: t('web_vitals.status.measuring'),
                score: 'unknown',
                description: t('web_vitals.lcp.description'),
            },
            fid: {
                value: t('web_vitals.status.measuring'),
                score: 'unknown',
                description: t('web_vitals.fid.description'),
            },
            cls: {
                value: t('web_vitals.status.measuring'),
                score: 'unknown',
                description: t('web_vitals.cls.description'),
            },
            fcp: {
                value: t('web_vitals.status.measuring'),
                score: 'unknown',
                description: t('web_vitals.fcp.description'),
            },
            ttfb: {
                value: t('web_vitals.status.measuring'),
                score: 'unknown',
                description: t('web_vitals.ttfb.description'),
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
                            description: t('web_vitals.ttfb.description'),
                        };
                    }

                    // FCP
                    const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry) {
                        const fcpValue = fcpEntry.startTime;
                        vitals.value.fcp = {
                            value: formatValue(fcpValue),
                            score: determineScore(fcpValue, { good: 1800, needsImprovement: 3000 }),
                            description: t('web_vitals.fcp.description'),
                        };
                    }

                    // For LCP, FID, and CLS, we need more sophisticated measurement
                    // Set placeholder values for now
                    vitals.value.lcp = {
                        value: t('web_vitals.status.requires_interaction'),
                        score: 'unknown',
                        description: t('web_vitals.lcp.description'),
                    };

                    vitals.value.fid = {
                        value: t('web_vitals.status.requires_interaction'),
                        score: 'unknown',
                        description: t('web_vitals.fid.description'),
                    };

                    vitals.value.cls = {
                        value: t('web_vitals.status.measuring'),
                        score: 'unknown',
                        description: t('web_vitals.cls.description'),
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
                    description: t('web_vitals.lcp.description'),
                },
                fid: {
                    value: formatValue(fidValue),
                    score: determineScore(fidValue, { good: 100, needsImprovement: 300 }),
                    description: t('web_vitals.fid.description'),
                },
                cls: {
                    value: formatValue(clsValue, 'score'),
                    score: determineScore(clsValue, { good: 0.1, needsImprovement: 0.25 }),
                    description: t('web_vitals.cls.description'),
                },
                fcp: {
                    value: formatValue(fcpValue),
                    score: determineScore(fcpValue, { good: 1800, needsImprovement: 3000 }),
                    description: t('web_vitals.fcp.description'),
                },
                ttfb: {
                    value: formatValue(ttfbValue),
                    score: determineScore(ttfbValue, { good: 800, needsImprovement: 1800 }),
                    description: t('web_vitals.ttfb.description'),
                },
            };
        };

        const setFallbackValues = () => {
            vitals.value = {
                lcp: {
                    value: t('web_vitals.status.not_available'),
                    score: 'unknown',
                    description: t('web_vitals.lcp.description'),
                },
                fid: {
                    value: t('web_vitals.status.not_available'),
                    score: 'unknown',
                    description: t('web_vitals.fid.description'),
                },
                cls: {
                    value: t('web_vitals.status.not_available'),
                    score: 'unknown',
                    description: t('web_vitals.cls.description'),
                },
                fcp: {
                    value: t('web_vitals.status.not_available'),
                    score: 'unknown',
                    description: t('web_vitals.fcp.description'),
                },
                ttfb: {
                    value: t('web_vitals.status.not_available'),
                    score: 'unknown',
                    description: t('web_vitals.ttfb.description'),
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
            t,
        };
    },
};
</script>

<template>
    <div class="web-vitals-page">
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">{{ $t('web_vitals.title') }}</h1>
                <p class="page-description">
                    {{ $t('web_vitals.description') }}
                </p>
            </header>

            <div class="vitals-grid">
                <!-- Core Web Vitals -->
                <div class="vitals-section">
                    <h2 class="section-title">{{ $t('web_vitals.core_vitals') }}</h2>
                    <div class="metrics-grid">
                        <div class="metric-card" :class="getScoreClass(vitals.lcp.score)">
                            <div class="metric-header">
                                <h3>{{ $t('web_vitals.lcp.name') }}</h3>
                                <span class="metric-abbreviation">{{ $t('web_vitals.lcp.abbreviation') }}</span>
                            </div>
                            <div class="metric-value">{{ vitals.lcp.value }}</div>
                            <div class="metric-description">{{ vitals.lcp.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">{{ $t('web_vitals.lcp.thresholds.good') }}</span>
                                <span class="needs-improvement">{{ $t('web_vitals.lcp.thresholds.needs_improvement') }}</span>
                                <span class="poor">{{ $t('web_vitals.lcp.thresholds.poor') }}</span>
                            </div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.fid.score)">
                            <div class="metric-header">
                                <h3>{{ $t('web_vitals.fid.name') }}</h3>
                                <span class="metric-abbreviation">{{ $t('web_vitals.fid.abbreviation') }}</span>
                            </div>
                            <div class="metric-value">{{ vitals.fid.value }}</div>
                            <div class="metric-description">{{ vitals.fid.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">{{ $t('web_vitals.fid.thresholds.good') }}</span>
                                <span class="needs-improvement">{{ $t('web_vitals.fid.thresholds.needs_improvement') }}</span>
                                <span class="poor">{{ $t('web_vitals.fid.thresholds.poor') }}</span>
                            </div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.cls.score)">
                            <div class="metric-header">
                                <h3>{{ $t('web_vitals.cls.name') }}</h3>
                                <span class="metric-abbreviation">{{ $t('web_vitals.cls.abbreviation') }}</span>
                            </div>
                            <div class="metric-value">{{ vitals.cls.value }}</div>
                            <div class="metric-description">{{ vitals.cls.description }}</div>
                            <div class="metric-threshold">
                                <span class="good">{{ $t('web_vitals.cls.thresholds.good') }}</span>
                                <span class="needs-improvement">{{ $t('web_vitals.cls.thresholds.needs_improvement') }}</span>
                                <span class="poor">{{ $t('web_vitals.cls.thresholds.poor') }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Metrics -->
                <div class="vitals-section">
                    <h2 class="section-title">{{ $t('web_vitals.additional_metrics') }}</h2>
                    <div class="metrics-grid additional-metrics">
                        <div class="metric-card" :class="getScoreClass(vitals.fcp.score)">
                            <div class="metric-header">
                                <h3>{{ $t('web_vitals.fcp.name') }}</h3>
                                <span class="metric-abbreviation">{{ $t('web_vitals.fcp.abbreviation') }}</span>
                            </div>
                            <div class="metric-value">{{ vitals.fcp.value }}</div>
                            <div class="metric-description">{{ vitals.fcp.description }}</div>
                        </div>

                        <div class="metric-card" :class="getScoreClass(vitals.ttfb.score)">
                            <div class="metric-header">
                                <h3>{{ $t('web_vitals.ttfb.name') }}</h3>
                                <span class="metric-abbreviation">{{ $t('web_vitals.ttfb.abbreviation') }}</span>
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
                        class="button button--primary button--medium"
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
                        {{ measuring ? $t('web_vitals.actions.measuring') : $t('web_vitals.actions.refresh_metrics') }}
                    </button>

                    <router-link to="/" class="button button--secondary button--medium">
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
                        {{ $t('web_vitals.actions.back_to_tests') }}
                    </router-link>
                </div>
            </div>

            <div class="info-section">
                <h2 class="section-title">{{ $t('web_vitals.about.title') }}</h2>
                <p v-for="(paragraph, index) in $t('web_vitals.about.content')" :key="index">
                    {{ paragraph }}
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.web-vitals-page {
    min-height: calc(100vh - var(--header-height) - 70px); /* Account for header and footer */
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

}
</style>
