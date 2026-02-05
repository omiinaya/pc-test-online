// Cross-browser performance monitoring with browser-specific optimizations
import { ref, onMounted, onUnmounted } from 'vue';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface PerformanceMetrics {
    // Core Web Vitals
    CLS: number | null; // Cumulative Layout Shift
    FID: number | null; // First Input Delay
    FCP: number | null; // First Contentful Paint
    LCP: number | null; // Largest Contentful Paint
    TTFB: number | null; // Time to First Byte

    // Custom metrics
    domContentLoaded: number | null;
    loadComplete: number | null;
    memoryUsage: number | null;

    // Browser-specific metrics
    browserScore: number;
    compatibilityIssues: string[];
    recommendations: string[];
}

export interface BrowserCapabilities {
    name: string;
    version: number;
    supportsWebVitals: boolean;
    supportsMemoryAPI: boolean;
    supportsNavigationTiming: boolean;
    supportsPerformanceObserver: boolean;
    supportsIntersectionObserver: boolean;
}

// Extended Performance interface with memory API
interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

export interface PerformanceBudget {
    LCP: number; // < 2.5s good, < 4.0s needs improvement
    FID: number; // < 100ms good, < 300ms needs improvement
    CLS: number; // < 0.1 good, < 0.25 needs improvement
    FCP: number; // < 1.8s good, < 3.0s needs improvement
    TTFB: number; // < 800ms good, < 1800ms needs improvement
}

export interface BundleSizeMetrics {
    initialBundleSize: number; // in bytes
    totalBundleSize: number; // in bytes
    lazyLoadedChunks: Array<{
        name: string;
        size: number;
        loadTime: number;
    }>;
    chunkCount: number;
    averageChunkSize: number;
}

export interface MemoryUsageMetrics {
    currentUsage: number; // in MB
    peakUsage: number; // in MB
    totalHeapSize: number; // in MB
    heapSizeLimit: number; // in MB
    usagePercentage: number;
    history: Array<{
        timestamp: number;
        usage: number;
    }>;
}

/**
 * Cross-browser performance monitoring composable
 * Provides comprehensive performance metrics with browser-specific recommendations
 */
export function usePerformance() {
    const metrics = ref<PerformanceMetrics>({
        CLS: null,
        FID: null,
        FCP: null,
        LCP: null,
        TTFB: null,
        domContentLoaded: null,
        loadComplete: null,
        memoryUsage: null,
        browserScore: 0,
        compatibilityIssues: [],
        recommendations: [],
    });

    const capabilities = ref<BrowserCapabilities>({
        name: '',
        version: 0,
        supportsWebVitals: false,
        supportsMemoryAPI: false,
        supportsNavigationTiming: false,
        supportsPerformanceObserver: false,
        supportsIntersectionObserver: false,
    });

    const budget = ref<PerformanceBudget>({
        LCP: 2500, // 2.5s
        FID: 100, // 100ms
        CLS: 0.1, // 0.1
        FCP: 1800, // 1.8s
        TTFB: 800, // 800ms
    });

    const isMonitoring = ref(false);
    const performanceGrade = ref<'A' | 'B' | 'C' | 'D' | 'F'>('A');

    /**
     * Detect browser capabilities for performance monitoring
     */
    const detectBrowserCapabilities = () => {
        const userAgent = navigator.userAgent;

        // Browser detection
        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            capabilities.value.name = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            capabilities.value.version = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Firefox')) {
            capabilities.value.name = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            capabilities.value.version = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            capabilities.value.name = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            capabilities.value.version = match ? parseInt(match[1] || '0') : 0;
        } else if (userAgent.includes('Edge')) {
            capabilities.value.name = 'Edge';
            const match = userAgent.match(/Edge?\/(\d+)/);
            capabilities.value.version = match ? parseInt(match[1] || '0') : 0;
        }

        // Feature detection
        capabilities.value.supportsWebVitals = !!(window.performance && window.PerformanceObserver);
        capabilities.value.supportsMemoryAPI = !!(performance as PerformanceWithMemory).memory;
        capabilities.value.supportsNavigationTiming = !!(
            window.performance && window.performance.navigation
        );
        capabilities.value.supportsPerformanceObserver = !!window.PerformanceObserver;
        capabilities.value.supportsIntersectionObserver = !!window.IntersectionObserver;

        // Generate browser-specific recommendations
        generateBrowserRecommendations();
    };

    /**
     * Generate browser-specific performance recommendations
     */
    const generateBrowserRecommendations = () => {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Chrome-specific
        if (capabilities.value.name === 'Chrome') {
            if (capabilities.value.version < 90) {
                issues.push('Older Chrome version may have performance limitations');
                recommendations.push('Update to Chrome 90+ for better Core Web Vitals support');
            }
        }

        // Firefox-specific
        if (capabilities.value.name === 'Firefox') {
            if (capabilities.value.version < 85) {
                issues.push('Firefox version lacks some performance APIs');
                recommendations.push('Update to Firefox 85+ for full performance monitoring');
            }
            if (!capabilities.value.supportsMemoryAPI) {
                issues.push('Memory API not available in Firefox');
                recommendations.push(
                    'Memory usage monitoring unavailable - Chrome recommended for full metrics'
                );
            }
        }

        // Safari-specific
        if (capabilities.value.name === 'Safari') {
            if (capabilities.value.version < 14) {
                issues.push('Safari version has limited performance API support');
                recommendations.push(
                    'Update to Safari 14+ or use Chrome/Firefox for comprehensive monitoring'
                );
            }
            if (!capabilities.value.supportsWebVitals) {
                issues.push('Limited Core Web Vitals support in Safari');
                recommendations.push(
                    'Consider Chrome or Firefox for complete performance insights'
                );
            }
        }

        // Edge-specific
        if (capabilities.value.name === 'Edge') {
            if (capabilities.value.version < 79) {
                issues.push('Legacy Edge has limited performance monitoring');
                recommendations.push('Use Chromium-based Edge 79+ for full performance features');
            }
        }

        // General API support issues
        if (!capabilities.value.supportsPerformanceObserver) {
            issues.push('PerformanceObserver API not supported');
            recommendations.push('Update browser for real-time performance monitoring');
        }

        if (!capabilities.value.supportsIntersectionObserver) {
            issues.push('IntersectionObserver not supported');
            recommendations.push('Update browser for advanced layout shift detection');
        }

        metrics.value.compatibilityIssues = issues;
        metrics.value.recommendations = recommendations;
    };

    /**
     * Initialize Core Web Vitals monitoring
     */
    const initWebVitals = () => {
        if (!capabilities.value.supportsWebVitals) {
            console.warn('Core Web Vitals not supported in this browser');
            return;
        }

        try {
            // Cumulative Layout Shift
            getCLS(metric => {
                metrics.value.CLS = metric.value;
                updatePerformanceGrade();
            });

            // First Input Delay
            getFID(metric => {
                metrics.value.FID = metric.value;
                updatePerformanceGrade();
            });

            // First Contentful Paint
            getFCP(metric => {
                metrics.value.FCP = metric.value;
                updatePerformanceGrade();
            });

            // Largest Contentful Paint
            getLCP(metric => {
                metrics.value.LCP = metric.value;
                updatePerformanceGrade();
            });

            // Time to First Byte
            getTTFB(metric => {
                metrics.value.TTFB = metric.value;
                updatePerformanceGrade();
            });
        } catch (error) {
            console.error('Web Vitals initialization failed:', error);
        }
    };

    /**
     * Monitor custom performance metrics
     */
    const monitorCustomMetrics = () => {
        // DOM Content Loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                metrics.value.domContentLoaded = performance.now();
            });
        } else {
            metrics.value.domContentLoaded = 0; // Already loaded
        }

        // Load complete
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                metrics.value.loadComplete = performance.now();
            });
        } else {
            metrics.value.loadComplete = 0; // Already loaded
        }

        // Memory usage (Chrome only)
        if (capabilities.value.supportsMemoryAPI) {
            const memory = (performance as PerformanceWithMemory).memory;
            metrics.value.memoryUsage = Math.round((memory?.usedJSHeapSize || 0) / 1024 / 1024); // MB
        }
    };

    /**
     * Calculate browser performance score
     */
    const calculateBrowserScore = (): number => {
        let score = 100;

        // Deduct points for missing capabilities
        if (!capabilities.value.supportsWebVitals) score -= 20;
        if (!capabilities.value.supportsMemoryAPI) score -= 10;
        if (!capabilities.value.supportsPerformanceObserver) score -= 15;
        if (!capabilities.value.supportsIntersectionObserver) score -= 5;

        // Browser-specific adjustments
        if (capabilities.value.name === 'Safari' && capabilities.value.version < 14) score -= 15;
        if (capabilities.value.name === 'Firefox' && capabilities.value.version < 85) score -= 10;
        if (capabilities.value.name === 'Edge' && capabilities.value.version < 79) score -= 20;

        return Math.max(0, score);
    };

    /**
     * Update performance grade based on metrics
     */
    const updatePerformanceGrade = () => {
        const scores: number[] = [];

        // Score Core Web Vitals
        if (metrics.value.LCP !== null) {
            if (metrics.value.LCP <= budget.value.LCP) scores.push(100);
            else if (metrics.value.LCP <= budget.value.LCP * 1.6) scores.push(75);
            else scores.push(50);
        }

        if (metrics.value.FID !== null) {
            if (metrics.value.FID <= budget.value.FID) scores.push(100);
            else if (metrics.value.FID <= budget.value.FID * 3) scores.push(75);
            else scores.push(50);
        }

        if (metrics.value.CLS !== null) {
            if (metrics.value.CLS <= budget.value.CLS) scores.push(100);
            else if (metrics.value.CLS <= budget.value.CLS * 2.5) scores.push(75);
            else scores.push(50);
        }

        if (metrics.value.FCP !== null) {
            if (metrics.value.FCP <= budget.value.FCP) scores.push(100);
            else if (metrics.value.FCP <= budget.value.FCP * 1.67) scores.push(75);
            else scores.push(50);
        }

        if (metrics.value.TTFB !== null) {
            if (metrics.value.TTFB <= budget.value.TTFB) scores.push(100);
            else if (metrics.value.TTFB <= budget.value.TTFB * 2.25) scores.push(75);
            else scores.push(50);
        }

        // Calculate average score
        const avgScore =
            scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;

        // Include browser score
        const browserScore = calculateBrowserScore();
        const finalScore = avgScore * 0.8 + browserScore * 0.2;

        // Assign grade
        if (finalScore >= 90) performanceGrade.value = 'A';
        else if (finalScore >= 80) performanceGrade.value = 'B';
        else if (finalScore >= 70) performanceGrade.value = 'C';
        else if (finalScore >= 60) performanceGrade.value = 'D';
        else performanceGrade.value = 'F';

        metrics.value.browserScore = Math.round(finalScore);
    };

    /**
     * Get performance summary
     */
    const getPerformanceSummary = () => ({
        grade: performanceGrade.value,
        score: metrics.value.browserScore,
        metrics: { ...metrics.value },
        capabilities: { ...capabilities.value },
        hasIssues: metrics.value.compatibilityIssues.length > 0,
        recommendations: metrics.value.recommendations,
    });

    /**
     * Start performance monitoring
     */
    const startMonitoring = () => {
        if (isMonitoring.value) return;

        isMonitoring.value = true;
        detectBrowserCapabilities();
        initWebVitals();
        monitorCustomMetrics();

        // Update browser score
        metrics.value.browserScore = calculateBrowserScore();
    };

    /**
     * Stop performance monitoring
     */
    const stopMonitoring = () => {
        isMonitoring.value = false;
    };

    /**
     * Track bundle sizes using Performance API
     * Measures initial bundle size and lazy-loaded chunks
     */
    const trackBundleSize = (): BundleSizeMetrics => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const lazyLoadedChunks: Array<{
            name: string;
            size: number;
            loadTime: number;
        }> = [];

        let initialBundleSize = 0;
        let totalBundleSize = 0;

        // Filter for JavaScript resources (bundles and chunks)
        const jsResources = entries.filter(entry => {
            const name = entry.name.toLowerCase();
            return name.endsWith('.js') && !name.includes('hot-update');
        });

        // Identify initial bundle (typically loaded early)
        const initialBundle = jsResources.find(entry => {
            const name = entry.name.toLowerCase();
            return (
                name.includes('index') ||
                name.includes('main') ||
                name.includes('app') ||
                name.includes('chunk-vendors')
            );
        });

        if (initialBundle) {
            initialBundleSize = initialBundle.transferSize || 0;
        }

        // Track all chunks
        jsResources.forEach(entry => {
            const chunkSize = entry.transferSize || 0;
            totalBundleSize += chunkSize;

            // Identify lazy-loaded chunks (loaded after initial bundle)
            if (entry.startTime > (initialBundle?.startTime || 0)) {
                lazyLoadedChunks.push({
                    name: entry.name.split('/').pop() || entry.name,
                    size: chunkSize,
                    loadTime: entry.duration,
                });
            }
        });

        const chunkCount = jsResources.length;
        const averageChunkSize = chunkCount > 0 ? totalBundleSize / chunkCount : 0;

        return {
            initialBundleSize,
            totalBundleSize,
            lazyLoadedChunks,
            chunkCount,
            averageChunkSize,
        };
    };

    /**
     * Track memory usage using Performance API
     * Measures memory usage over time (Chrome only)
     */
    const trackMemoryUsage = (): MemoryUsageMetrics => {
        const perf = performance as PerformanceWithMemory;
        const memory = perf.memory;

        if (!memory) {
            return {
                currentUsage: 0,
                peakUsage: 0,
                totalHeapSize: 0,
                heapSizeLimit: 0,
                usagePercentage: 0,
                history: [],
            };
        }

        const currentUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        const totalHeapSize = Math.round(memory.totalJSHeapSize / 1024 / 1024); // MB
        const heapSizeLimit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB
        const usagePercentage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

        // Track peak usage (stored in a closure variable)
        let peakUsage = currentUsage;
        const history: Array<{ timestamp: number; usage: number }> = [];

        // Get historical memory data from performance entries if available
        const memoryEntries = performance
            .getEntriesByType('measure')
            .filter(entry => entry.name.startsWith('memory-'));

        memoryEntries.forEach(entry => {
            const usage = parseFloat(entry.name.split('-')[1] || '0') || 0;
            if (usage > peakUsage) {
                peakUsage = usage;
            }
            history.push({
                timestamp: entry.startTime,
                usage,
            });
        });

        // Add current reading to history
        history.push({
            timestamp: performance.now(),
            usage: currentUsage,
        });

        return {
            currentUsage,
            peakUsage,
            totalHeapSize,
            heapSizeLimit,
            usagePercentage,
            history,
        };
    };

    // Auto-start monitoring on mount
    onMounted(() => {
        startMonitoring();
    });

    onUnmounted(() => {
        stopMonitoring();
    });

    return {
        // State
        metrics,
        capabilities,
        budget,
        isMonitoring,
        performanceGrade,

        // Methods
        startMonitoring,
        stopMonitoring,
        getPerformanceSummary,
        updatePerformanceGrade,
        trackBundleSize,
        trackMemoryUsage,

        // Computed getters
        get hasPerformanceIssues() {
            return metrics.value.compatibilityIssues.length > 0;
        },
        get browserSupportsFullMonitoring() {
            return (
                capabilities.value.supportsWebVitals &&
                capabilities.value.supportsPerformanceObserver
            );
        },
    };
}
