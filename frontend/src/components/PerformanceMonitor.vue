<script>
import { computed } from 'vue';
import { usePerformance } from '../composables/usePerformance';
import { useI18n } from 'vue-i18n';

export default {
    name: 'PerformanceMonitor',
    setup() {
        const performanceMonitor = usePerformance();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { t } = useI18n();

        const webVitalsScore = computed(() => {
            const vitals = [
                performanceMonitor.metrics.value.LCP,
                performanceMonitor.metrics.value.FID,
                performanceMonitor.metrics.value.CLS,
                performanceMonitor.metrics.value.FCP,
                performanceMonitor.metrics.value.TTFB,
            ].filter(v => v !== null);

            if (vitals.length === 0) return 0;

            // Simple scoring - could be enhanced
            return Math.round(vitals.length * 20); // 20 points per vital measured
        });

        const browserCapabilityScore = computed(() => {
            const caps = performanceMonitor.capabilities.value;
            let score = 0;

            if (caps.supportsWebVitals) score += 40;
            if (caps.supportsMemoryAPI) score += 20;
            if (caps.supportsPerformanceObserver) score += 20;
            if (caps.supportsIntersectionObserver) score += 10;
            if (caps.supportsNavigationTiming) score += 10;

            return score;
        });

        const getVitalStatus = vital => {
            const value = performanceMonitor.metrics.value[vital];
            if (value === null) return 'loading';

            const budgets = {
                LCP: 2500,
                FID: 100,
                CLS: 0.1,
                FCP: 1800,
                TTFB: 800,
            };

            const budget = budgets[vital];
            if (!budget) return 'unknown';

            if (value <= budget) return 'good';
            if (value <= budget * (vital === 'CLS' ? 2.5 : vital === 'FID' ? 3 : 1.6))
                return 'needs-improvement';
            return 'poor';
        };

        const formatVital = (value, unit) => {
            if (value === null) return '...';

            if (unit === 'ms') {
                return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
            }

            return typeof value === 'number' ? value.toFixed(3) : value;
        };

        return {
            ...performanceMonitor,
            webVitalsScore,
            browserCapabilityScore,
            getVitalStatus,
            formatVital,
        };
    },
};
</script>

<template>
    <div class="performance-monitor">
        <div class="performance-header">
            <h3>
                <span class="performance-icon">⚡</span>
                {{ t('performance.monitor') }}
                <span class="performance-grade" :class="`grade-${performanceGrade.toLowerCase()}`">
                    {{ performanceGrade }}
                </span>
            </h3>
            <div class="browser-info">
                {{ capabilities.name }} {{ capabilities.version }}
                <span v-if="!browserSupportsFullMonitoring" class="limited-support">{{
                    t('compatibility.warnings.limited_support')
                }}</span>
            </div>
        </div>

        <!-- Performance Score -->
        <div class="performance-score">
            <div class="score-circle" :class="`grade-${performanceGrade.toLowerCase()}`">
                <span class="score-value">{{ metrics.browserScore }}</span>
                <span class="score-label">{{ t('performance.score') }}</span>
            </div>
            <div class="score-details">
                <div class="score-breakdown">
                    <div class="breakdown-item">
                        <span class="breakdown-label">{{ t('performance.web_vitals_score') }}</span>
                        <span class="breakdown-value">{{ webVitalsScore }}%</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">{{
                            t('performance.browser_support_score')
                        }}</span>
                        <span class="breakdown-value">{{ browserCapabilityScore }}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Core Web Vitals -->
        <div class="web-vitals" v-if="capabilities.supportsWebVitals">
            <h4>{{ t('performance.web_vitals') }}</h4>
            <div class="vitals-grid">
                <div class="vital-item" :class="getVitalStatus('LCP')">
                    <div class="vital-label">LCP</div>
                    <div class="vital-value">{{ formatVital(metrics.LCP, 'ms') }}</div>
                    <div class="vital-description">{{ t('performance.vitals.lcp') }}</div>
                </div>
                <div class="vital-item" :class="getVitalStatus('FID')">
                    <div class="vital-label">FID</div>
                    <div class="vital-value">{{ formatVital(metrics.FID, 'ms') }}</div>
                    <div class="vital-description">{{ t('performance.vitals.fid') }}</div>
                </div>
                <div class="vital-item" :class="getVitalStatus('CLS')">
                    <div class="vital-label">CLS</div>
                    <div class="vital-value">{{ formatVital(metrics.CLS, '') }}</div>
                    <div class="vital-description">{{ t('performance.vitals.cls') }}</div>
                </div>
                <div class="vital-item" :class="getVitalStatus('FCP')">
                    <div class="vital-label">FCP</div>
                    <div class="vital-value">{{ formatVital(metrics.FCP, 'ms') }}</div>
                    <div class="vital-description">{{ t('performance.vitals.fcp') }}</div>
                </div>
                <div class="vital-item" :class="getVitalStatus('TTFB')">
                    <div class="vital-label">TTFB</div>
                    <div class="vital-value">{{ formatVital(metrics.TTFB, 'ms') }}</div>
                    <div class="vital-description">{{ t('performance.vitals.ttfb') }}</div>
                </div>
                <div class="vital-item" v-if="metrics.memoryUsage">
                    <div class="vital-label">{{ t('performance.vitals.memory') }}</div>
                    <div class="vital-value">{{ metrics.memoryUsage }}MB</div>
                    <div class="vital-description">
                        {{ t('performance.vitals.memory_description') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Browser Compatibility Issues -->
        <div v-if="hasPerformanceIssues" class="compatibility-issues">
            <h4>{{ t('compatibility.warnings.performance_limitations') }}</h4>
            <ul class="issues-list">
                <li v-for="issue in metrics.compatibilityIssues" :key="issue" class="issue-item">
                    {{ issue }}
                </li>
            </ul>
        </div>

        <!-- Recommendations -->
        <div v-if="metrics.recommendations.length > 0" class="recommendations">
            <h4>{{ t('compatibility.warnings.recommendations') }}</h4>
            <ul class="recommendations-list">
                <li v-for="rec in metrics.recommendations" :key="rec" class="recommendation-item">
                    {{ rec }}
                </li>
            </ul>
        </div>

        <!-- Browser Capabilities -->
        <details class="capabilities-details">
            <summary>{{ t('performance.browser_capabilities') }}</summary>
            <div class="capabilities-grid">
                <div class="capability-item" :class="{ supported: capabilities.supportsWebVitals }">
                    <span class="capability-icon">{{
                        capabilities.supportsWebVitals ? '✅' : '❌'
                    }}</span>
                    Web Vitals API
                </div>
                <div class="capability-item" :class="{ supported: capabilities.supportsMemoryAPI }">
                    <span class="capability-icon">{{
                        capabilities.supportsMemoryAPI ? '✅' : '❌'
                    }}</span>
                    Memory API
                </div>
                <div
                    class="capability-item"
                    :class="{ supported: capabilities.supportsPerformanceObserver }"
                >
                    <span class="capability-icon">{{
                        capabilities.supportsPerformanceObserver ? '✅' : '❌'
                    }}</span>
                    Performance Observer
                </div>
                <div
                    class="capability-item"
                    :class="{ supported: capabilities.supportsIntersectionObserver }"
                >
                    <span class="capability-icon">{{
                        capabilities.supportsIntersectionObserver ? '✅' : '❌'
                    }}</span>
                    Intersection Observer
                </div>
                <div
                    class="capability-item"
                    :class="{ supported: capabilities.supportsNavigationTiming }"
                >
                    <span class="capability-icon">{{
                        capabilities.supportsNavigationTiming ? '✅' : '❌'
                    }}</span>
                    Navigation Timing
                </div>
            </div>
        </details>
    </div>
</template>

<style scoped>
.performance-monitor {
    background: var(--surface-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    font-family: var(--font-family-mono, monospace);
}

.performance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
}

.performance-header h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
}

.performance-icon {
    font-size: var(--font-size-xl);
}

.performance-grade {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-small);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
}

.grade-a {
    background: var(--success-bg);
    color: var(--success-color);
}
.grade-b {
    background: var(--info-bg);
    color: var(--info-color);
}
.grade-c {
    background: var(--warning-bg);
    color: var(--warning-color);
}
.grade-d {
    background: var(--error-bg);
    color: var(--error-color);
}
.grade-f {
    background: var(--error-bg);
    color: var(--error-color);
}

.browser-info {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.limited-support {
    color: var(--warning-color);
    font-weight: var(--font-weight-semibold);
}

.performance-score {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
}

.score-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
}

.score-circle.grade-a {
    border-color: var(--success-color);
}
.score-circle.grade-b {
    border-color: var(--info-color);
}
.score-circle.grade-c {
    border-color: var(--warning-color);
}
.score-circle.grade-d {
    border-color: var(--error-color);
}
.score-circle.grade-f {
    border-color: var(--error-color);
}

.score-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
}

.score-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-transform: uppercase;
}

.score-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--surface-secondary);
    border-radius: var(--border-radius-small);
    min-width: 200px;
}

.breakdown-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.breakdown-value {
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.web-vitals h4 {
    margin: 0 0 var(--spacing-md);
    color: var(--text-primary);
    font-size: var(--font-size-md);
}

.vitals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
}

.vital-item {
    padding: var(--spacing-md);
    background: var(--surface-secondary);
    border-radius: var(--border-radius);
    border-left: 4px solid;
    text-align: center;
}

.vital-item.good {
    border-color: var(--success-color);
}
.vital-item.needs-improvement {
    border-color: var(--warning-color);
}
.vital-item.poor {
    border-color: var(--error-color);
}
.vital-item.loading {
    border-color: var(--border-color);
}

.vital-label {
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
}

.vital-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    font-variant-numeric: tabular-nums;
}

.vital-description {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    line-height: 1.2;
}

.compatibility-issues {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--warning-bg);
    border-radius: var(--border-radius);
    border: 1px solid var(--warning-border);
}

.compatibility-issues h4 {
    margin: 0 0 var(--spacing-sm);
    color: var(--warning-color);
    font-size: var(--font-size-md);
}

.issues-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.issue-item {
    padding: var(--spacing-xs) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.issue-item:before {
    content: '⚠️ ';
    margin-right: var(--spacing-xs);
}

.recommendations {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--info-bg);
    border-radius: var(--border-radius);
    border: 1px solid var(--info-border);
}

.recommendations h4 {
    margin: 0 0 var(--spacing-sm);
    color: var(--info-color);
    font-size: var(--font-size-md);
}

.recommendations-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.recommendation-item {
    padding: var(--spacing-xs) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.recommendation-item:before {
    content: '💡 ';
    margin-right: var(--spacing-xs);
}

.capabilities-details {
    margin-top: var(--spacing-lg);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
}

.capabilities-details summary {
    padding: var(--spacing-md);
    background: var(--surface-secondary);
    cursor: pointer;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
}

.capabilities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
}

.capability-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--surface-tertiary);
    border-radius: var(--border-radius-small);
    font-size: var(--font-size-sm);
}

.capability-item.supported {
    color: var(--success-color);
}

.capability-item:not(.supported) {
    color: var(--text-muted);
}

.capability-icon {
    font-size: var(--font-size-md);
}
</style>
