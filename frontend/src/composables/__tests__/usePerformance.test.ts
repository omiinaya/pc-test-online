import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePerformance } from '../usePerformance';

// Mock web-vitals
vi.mock('web-vitals', () => ({
    getCLS: vi.fn(cb => {}),
    getFID: vi.fn(cb => {}),
    getFCP: vi.fn(cb => {}),
    getLCP: vi.fn(cb => {}),
    getTTFB: vi.fn(cb => {}),
}));

// Mock performance API
const createMockPerformance = () => ({
    timing: {
        navigationStart: 100,
        redirectStart: 0,
        redirectEnd: 0,
        fetchStart: 120,
        domainLookupStart: 130,
        domainLookupEnd: 140,
        connectStart: 150,
        connectEnd: 160,
        requestStart: 170,
        responseStart: 200,
        responseEnd: 300,
        domLoading: 400,
        domInteractive: 500,
        domContentLoadedEventStart: 600,
        domContentLoadedEventEnd: 700,
        loadEventStart: 800,
    },
    memory: {
        usedJSHeapSize: 30 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024,
    },
    getEntriesByType: vi.fn().mockReturnValue([]),
    now: () => Date.now(),
});

beforeEach(() => {
    vi.clearAllMocks();
    const mockPerf = createMockPerformance();
    (window as any).performance = mockPerf;
    (window as any).PerformanceObserver = class PerformanceObserver {
        observe() {}
        disconnect() {}
    };
    // Reset userAgent
    Object.defineProperty(navigator, 'userAgent', { value: 'MockBrowser/1.0', configurable: true });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('usePerformance', () => {
    it('should initialize with default metrics and capabilities', () => {
        const perf = usePerformance();
        expect(perf.metrics.value.CLS).toBeNull();
        expect(perf.metrics.value.FID).toBeNull();
        expect(perf.metrics.value.LCP).toBeNull();
        expect(perf.metrics.value.browserScore).toBe(0);
        expect(perf.capabilities.value.name).toBe('');
        expect(perf.isMonitoring.value).toBe(false);
        expect(perf.performanceGrade.value).toBe('A');
    });

    describe('capability detection', () => {
        it('should detect Chrome browser correctly after startMonitoring', () => {
            Object.defineProperty(navigator, 'userAgent', { value: 'Chrome/95.0.1234.56' });
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.capabilities.value.name).toBe('Chrome');
            expect(perf.capabilities.value.version).toBe(95);
        });

        it('should detect Firefox browser correctly after startMonitoring', () => {
            Object.defineProperty(navigator, 'userAgent', { value: 'Firefox/90.0' });
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.capabilities.value.name).toBe('Firefox');
            expect(perf.capabilities.value.version).toBe(90);
        });

        it('should detect Safari browser correctly after startMonitoring', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Version/15.0 Safari/605.1.15',
            });
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.capabilities.value.name).toBe('Safari');
            expect(perf.capabilities.value.version).toBe(15);
        });

        it('should detect Edge (Legacy) browser correctly after startMonitoring', () => {
            Object.defineProperty(navigator, 'userAgent', { value: 'Edge/95.0.1020.40' });
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.capabilities.value.name).toBe('Edge');
            expect(perf.capabilities.value.version).toBe(95);
        });

        it('should set WebVitals support based on PerformanceObserver after startMonitoring', () => {
            (window as any).PerformanceObserver = class PerformanceObserver {};
            const perf = usePerformance();
            expect(perf.capabilities.value.supportsWebVitals).toBe(false); // before start
            perf.startMonitoring();
            expect(perf.capabilities.value.supportsWebVitals).toBe(true);
        });

        it('should set MemoryAPI support if performance.memory exists after startMonitoring', () => {
            (window as any).performance.memory = createMockPerformance().memory;
            const perf = usePerformance();
            expect(perf.capabilities.value.supportsMemoryAPI).toBe(false); // before start
            perf.startMonitoring();
            expect(perf.capabilities.value.supportsMemoryAPI).toBe(true);
        });

        it('should generate recommendations for older Chrome after startMonitoring', () => {
            Object.defineProperty(navigator, 'userAgent', { value: 'Chrome/85.0' });
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.metrics.value.compatibilityIssues).toContain(
                'Older Chrome version may have performance limitations'
            );
            expect(perf.metrics.value.recommendations).toContain(
                'Update to Chrome 90+ for better Core Web Vitals support'
            );
        });

        it('should generate recommendations for Safari when WebVitals not supported', () => {
            // Safari 13 with no WebVitals support
            Object.defineProperty(navigator, 'userAgent', { value: 'Safari/13.0' });
            // Ensure PerformanceObserver is not available
            delete (window as any).PerformanceObserver;
            const perf = usePerformance();
            perf.startMonitoring();
            expect(perf.metrics.value.compatibilityIssues).toContain(
                'Limited Core Web Vitals support in Safari'
            );
        });
    });

    describe('monitoring control', () => {
        it('should start and stop monitoring', () => {
            const perf = usePerformance();
            expect(perf.isMonitoring.value).toBe(false);
            perf.startMonitoring();
            expect(perf.isMonitoring.value).toBe(true);
            perf.stopMonitoring();
            expect(perf.isMonitoring.value).toBe(false);
        });
    });

    describe('performance grading', () => {
        it('should default to grade A', () => {
            const perf = usePerformance();
            expect(perf.performanceGrade.value).toBe('A');
        });

        it('should compute hasPerformanceIssues correctly', () => {
            const perf = usePerformance();
            expect(perf.hasPerformanceIssues).toBe(false);
            perf.metrics.value.compatibilityIssues.push('Test issue');
            expect(perf.hasPerformanceIssues).toBe(true);
        });

        it('should compute browserSupportsFullMonitoring correctly after startMonitoring', () => {
            (window as any).PerformanceObserver = class {};
            const perf = usePerformance();
            expect(perf.browserSupportsFullMonitoring).toBe(false); // before start
            perf.startMonitoring();
            expect(perf.browserSupportsFullMonitoring).toBe(true);
        });
    });

    describe('budget configuration', () => {
        it('should have default budget thresholds', () => {
            const perf = usePerformance();
            expect(perf.budget.value.LCP).toBe(2500);
            expect(perf.budget.value.FID).toBe(100);
            expect(perf.budget.value.CLS).toBe(0.1);
            expect(perf.budget.value.FCP).toBe(1800);
            expect(perf.budget.value.TTFB).toBe(800);
        });

        it('should allow updating budget values', () => {
            const perf = usePerformance();
            perf.budget.value.LCP = 3000;
            expect(perf.budget.value.LCP).toBe(3000);
        });
    });

    describe('getPerformanceSummary', () => {
        it('should return summary object with metrics, capabilities, grade, score, hasIssues, recommendations after startMonitoring', () => {
            const perf = usePerformance();
            perf.startMonitoring();
            const summary = perf.getPerformanceSummary();
            expect(summary).toHaveProperty('grade');
            expect(summary).toHaveProperty('score');
            expect(summary).toHaveProperty('metrics');
            expect(summary).toHaveProperty('capabilities');
            expect(summary).toHaveProperty('hasIssues');
            expect(summary).toHaveProperty('recommendations');
            expect(summary.metrics).toEqual(perf.metrics.value);
            expect(summary.capabilities).toEqual(perf.capabilities.value);
            expect(summary.grade).toBe(perf.performanceGrade.value);
            expect(summary.score).toBe(perf.metrics.value.browserScore);
        });
    });

    describe('trackBundleSize', () => {
        it('should process resource entries without throwing', () => {
            const mockPerf = (window as any).performance;
            mockPerf.getEntriesByType.mockReturnValue([
                { name: 'index.js', duration: 100 } as any,
                { name: 'main.js', duration: 200 } as any,
            ]);
            const perf = usePerformance();
            expect(() => {
                perf.trackBundleSize();
            }).not.toThrow();
        });
    });

    describe('trackMemoryUsage', () => {
        it('should return memory usage metrics object when memory available', () => {
            const mockPerf = (window as any).performance;
            mockPerf.memory = createMockPerformance().memory;
            // Mock some historical entries
            mockPerf.getEntriesByType.mockImplementation((type: string) => {
                if (type === 'measure') {
                    return [
                        { name: 'memory-40', startTime: 100 } as any,
                        { name: 'memory-30', startTime: 200 } as any,
                    ];
                }
                return [];
            });
            const perf = usePerformance();
            perf.startMonitoring();
            const memory = perf.trackMemoryUsage();
            expect(memory).toHaveProperty('currentUsage');
            expect(memory).toHaveProperty('peakUsage');
            expect(memory).toHaveProperty('totalHeapSize');
            expect(memory).toHaveProperty('heapSizeLimit');
            expect(memory).toHaveProperty('usagePercentage');
            expect(memory).toHaveProperty('history');
            // Should have recorded the peak from history (40) and current
            expect(memory.peakUsage).toBeGreaterThanOrEqual(memory.currentUsage);
            expect(memory.history.length).toBeGreaterThanOrEqual(1);
        });

        it('should return zeroed metrics when memory not available', () => {
            delete (window as any).performance.memory;
            const perf = usePerformance();
            const memory = perf.trackMemoryUsage();
            expect(memory.currentUsage).toBe(0);
            expect(memory.peakUsage).toBe(0);
            expect(memory.totalHeapSize).toBe(0);
            expect(memory.heapSizeLimit).toBe(0);
            expect(memory.usagePercentage).toBe(0);
            expect(memory.history).toEqual([]);
        });

        it('should calculate usage percentage correctly', () => {
            const mockPerf = (window as any).performance;
            mockPerf.memory = createMockPerformance().memory;
            const perf = usePerformance();
            perf.startMonitoring();
            const memory = perf.trackMemoryUsage();
            expect(memory.usagePercentage).toBeGreaterThanOrEqual(0);
            expect(memory.usagePercentage).toBeLessThanOrEqual(100);
        });
    });
});
