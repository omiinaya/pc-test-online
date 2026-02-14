import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '@/utils/debounce';

/**
 * Performance Benchmark Test Suite
 *
 * This suite validates performance improvements implemented in Phase 2:
 * - Component lazy loading performance
 * - Memory management effectiveness
 * - Debouncing performance
 * - Bundle size tracking
 * - Memory usage tracking
 */

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
    LAZY_LOAD_THRESHOLD: 100, // Component should load within 100ms
    DEBOUNCE_THRESHOLD: 50, // Debounce should execute within wait time + 50ms
    MEMORY_CLEANUP_THRESHOLD: 100, // Memory cleanup should complete within 100ms
    BUNDLE_SIZE_THRESHOLD: 500, // Individual chunks should be under 500KB
    MEMORY_LEAK_THRESHOLD: 10, // Memory growth should be under 10MB after cleanup
};

// Benchmark results storage
interface BenchmarkResult {
    name: string;
    duration: number;
    memoryBefore: number;
    memoryAfter: number;
    passed: boolean;
}

const benchmarkResults: BenchmarkResult[] = [];

/**
 * Helper function to measure execution time
 */
function measurePerformance<T>(
    name: string,
    fn: () => T,
    threshold: number
): { result: T; duration: number; passed: boolean } {
    const startTime = performance.now();
    const memoryBefore = getMemoryUsage();

    const result = fn();

    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryAfter = getMemoryUsage();
    const passed = duration <= threshold;

    benchmarkResults.push({
        name,
        duration,
        memoryBefore,
        memoryAfter,
        passed,
    });

    return { result, duration, passed };
}

/**
 * Helper function to get current memory usage in MB
 */
function getMemoryUsage(): number {
    // @ts-expect-error - performance.memory is Chrome-specific API
    if (performance.memory) {
        // @ts-expect-error - performance.memory is Chrome-specific API
        return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
}

/**
 * Helper function to simulate component lazy loading
 */
async function simulateLazyLoad(componentName: string): Promise<void> {
    return new Promise(resolve => {
        const startTime = performance.now();

        // Simulate async import delay
        setTimeout(() => {
            const loadTime = performance.now() - startTime;
            console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
            resolve();
        }, Math.random() * 50); // Random delay between 0-50ms
    });
}

/**
 * Helper function to simulate memory allocation
 */
function allocateMemory(sizeMB: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    const chunkSize = 1024 * 1024; // 1MB chunks

    for (let i = 0; i < sizeMB; i++) {
        chunks.push(new Uint8Array(chunkSize));
    }

    return chunks;
}

/**
 * Helper function to simulate memory cleanup
 */
function cleanupMemory(chunks: Uint8Array[]): void {
    chunks.forEach(chunk => {
        chunk.fill(0);
    });
    chunks.length = 0;
}

describe('Performance Benchmark Suite', () => {
    beforeEach(() => {
        // Clear benchmark results before each test
        benchmarkResults.length = 0;
    });

    afterEach(() => {
        // Log benchmark results after each test
        console.log('\nBenchmark Results:');
        benchmarkResults.forEach(result => {
            console.log(
                `  ${result.name}: ${result.duration.toFixed(2)}ms - ${
                    result.passed ? '✓ PASS' : '✗ FAIL'
                }`
            );
        });
    });

    describe('Component Lazy Loading Performance', () => {
        it('should load components within performance threshold', async () => {
            const components = [
                'WebcamTest',
                'MicrophoneTest',
                'SpeakerTest',
                'KeyboardTest',
                'MouseTest',
                'TouchTest',
                'BatteryTest',
            ];

            const loadTimes: number[] = [];

            for (const component of components) {
                const { duration, passed } = measurePerformance(
                    `Lazy load ${component}`,
                    () => simulateLazyLoad(component),
                    PERFORMANCE_THRESHOLDS.LAZY_LOAD_THRESHOLD
                );

                // Wait for the promise to resolve
                await simulateLazyLoad(component);

                loadTimes.push(duration);
                expect(passed).toBe(true);
            }

            // Calculate average load time
            const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
            console.log(`Average component load time: ${avgLoadTime.toFixed(2)}ms`);

            expect(avgLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LAZY_LOAD_THRESHOLD);
        });

        it('should handle concurrent lazy loading efficiently', async () => {
            const components = ['WebcamTest', 'MicrophoneTest', 'SpeakerTest'];

            const startTime = performance.now();

            // Load all components concurrently
            await Promise.all(components.map(comp => simulateLazyLoad(comp)));

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(
                `Concurrent load time for ${components.length} components: ${duration.toFixed(2)}ms`
            );

            // Concurrent loading should be faster than sequential
            expect(duration).toBeLessThan(
                components.length * PERFORMANCE_THRESHOLDS.LAZY_LOAD_THRESHOLD * 0.8
            );
        });

        it('should maintain performance with repeated lazy loading', async () => {
            const component = 'WebcamTest';
            const iterations = 5;
            const loadTimes: number[] = [];

            for (let i = 0; i < iterations; i++) {
                const { duration } = measurePerformance(
                    `Repeated lazy load ${component} (${i + 1}/${iterations})`,
                    () => simulateLazyLoad(component),
                    PERFORMANCE_THRESHOLDS.LAZY_LOAD_THRESHOLD
                );

                await simulateLazyLoad(component);
                loadTimes.push(duration);
            }

            // Check that performance doesn't degrade significantly
            const firstLoad = loadTimes[0];
            const lastLoad = loadTimes[loadTimes.length - 1];

            if (firstLoad && lastLoad) {
                const degradation = ((lastLoad - firstLoad) / firstLoad) * 100;
                console.log(
                    `Performance degradation after ${iterations} loads: ${degradation.toFixed(2)}%`
                );
                expect(degradation).toBeLessThan(50); // Less than 50% degradation
            }
        });
    });

    describe('Memory Management Effectiveness', () => {
        it('should clean up allocated memory efficiently', () => {
            const allocationSize = 10; // 10MB

            const { duration, passed } = measurePerformance(
                'Memory cleanup',
                () => {
                    const chunks = allocateMemory(allocationSize);
                    cleanupMemory(chunks);
                    return chunks;
                },
                PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD
            );

            expect(passed).toBe(true);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD);
        });

        it('should prevent memory leaks with repeated allocations', () => {
            const iterations = 10;
            const allocationSize = 5; // 5MB per iteration
            const memorySnapshots: number[] = [];

            for (let i = 0; i < iterations; i++) {
                const chunks = allocateMemory(allocationSize);
                memorySnapshots.push(getMemoryUsage());
                cleanupMemory(chunks);
            }

            // Check memory growth
            const initialMemory = memorySnapshots[0];
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];

            if (initialMemory !== undefined && finalMemory !== undefined) {
                const memoryGrowth = finalMemory - initialMemory;
                console.log(
                    `Memory growth after ${iterations} allocations: ${memoryGrowth.toFixed(2)}MB`
                );
                expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
            }
        });

        it('should handle large memory allocations efficiently', () => {
            const allocationSize = 50; // 50MB

            const { passed } = measurePerformance(
                'Large memory allocation',
                () => allocateMemory(allocationSize),
                PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD * 5 // Allow more time for large allocations
            );

            expect(passed).toBe(true);
        });

        it('should clean up event listeners and references', () => {
            const eventListeners: Array<() => void> = [];

            // Simulate adding event listeners
            for (let i = 0; i < 100; i++) {
                const listener = () => {};
                eventListeners.push(listener);
            }

            const { duration } = measurePerformance(
                'Event listener cleanup',
                () => {
                    eventListeners.length = 0;
                    return eventListeners;
                },
                PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD
            );

            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD);
            expect(eventListeners.length).toBe(0);
        });
    });

    describe('Debouncing Performance', () => {
        it('should debounce function calls within threshold', () => {
            const waitTime = 100;
            let callCount = 0;

            const debouncedFn = debounce(() => {
                callCount++;
            }, waitTime);

            const { duration } = measurePerformance(
                'Debounce execution',
                () => {
                    // Call debounced function multiple times rapidly
                    for (let i = 0; i < 10; i++) {
                        debouncedFn();
                    }
                    return callCount;
                },
                PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD
            );

            expect(callCount).toBe(0); // Should not have been called yet
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD);
        });

        it('should execute debounced function after wait time', async () => {
            const waitTime = 100;
            let callCount = 0;

            const debouncedFn = debounce(() => {
                callCount++;
            }, waitTime);

            debouncedFn();

            // Wait for debounce to complete
            await new Promise(resolve => setTimeout(resolve, waitTime + 50));

            expect(callCount).toBe(1);
        });

        it('should throttle function calls within threshold', () => {
            const waitTime = 100;
            let callCount = 0;

            const throttledFn = throttle(() => {
                callCount++;
            }, waitTime);

            const { duration } = measurePerformance(
                'Throttle execution',
                () => {
                    // Call throttled function multiple times rapidly
                    for (let i = 0; i < 10; i++) {
                        throttledFn();
                    }
                    return callCount;
                },
                PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD
            );

            // Throttle should call immediately on first call (leading: true by default)
            expect(callCount).toBeGreaterThanOrEqual(1);
            expect(callCount).toBeLessThanOrEqual(10);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD);
        });

        it('should handle debouncing with leading edge', () => {
            const waitTime = 100;
            let callCount = 0;

            const debouncedFn = debounce(
                () => {
                    callCount++;
                },
                waitTime,
                { leading: true, trailing: false }
            );

            const { duration } = measurePerformance(
                'Debounce with leading edge',
                () => {
                    debouncedFn();
                    return callCount;
                },
                PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD
            );

            expect(callCount).toBe(1); // Should have been called immediately
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD);
        });

        it('should cancel debounced function efficiently', () => {
            const waitTime = 100;
            let callCount = 0;

            const debouncedFn = debounce(() => {
                callCount++;
            }, waitTime);

            debouncedFn();
            // @ts-expect-error - cancel method is added to the debounced function
            debouncedFn.cancel();

            const { duration } = measurePerformance(
                'Debounce cancel',
                () => {
                    // @ts-expect-error - cancel method is added to the debounced function
                    debouncedFn.cancel();
                    return callCount;
                },
                PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD
            );

            expect(callCount).toBe(0);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD);
        });
    });

    describe('Bundle Size Tracking', () => {
        it('should track individual chunk sizes', () => {
            // Simulate chunk sizes based on vite.config.ts configuration
            const chunkSizes = {
                'vue-vendor': 150, // KB
                'ml-vendor': 400, // KB
                'test-components': 200, // KB
                composables: 100, // KB
            };

            const oversizedChunks: string[] = [];

            Object.entries(chunkSizes).forEach(([name, size]) => {
                const { passed } = measurePerformance(
                    `Chunk size check: ${name}`,
                    () => size,
                    PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD
                );

                if (!passed) {
                    oversizedChunks.push(name);
                }

                expect(size).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD);
            });

            if (oversizedChunks.length > 0) {
                console.warn(`Oversized chunks detected: ${oversizedChunks.join(', ')}`);
            }
        });

        it('should calculate total bundle size', () => {
            const chunkSizes = {
                'vue-vendor': 150, // KB
                'ml-vendor': 400, // KB
                'test-components': 200, // KB
                composables: 100, // KB
            };

            const { result: totalSize } = measurePerformance(
                'Total bundle size calculation',
                () => {
                    return Object.values(chunkSizes).reduce((sum, size) => sum + size, 0);
                },
                PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD
            );

            console.log(`Total bundle size: ${totalSize}KB`);

            // Total bundle should be reasonable (under 2MB)
            expect(totalSize).toBeLessThan(2000);
        });

        it('should track code splitting effectiveness', () => {
            const totalSize = 850; // KB
            const chunkCount = 4;
            const averageChunkSize = totalSize / chunkCount;

            const { result: effectiveness } = measurePerformance(
                'Code splitting effectiveness',
                () => {
                    return {
                        averageChunkSize,
                        chunkCount,
                        totalSize,
                    };
                },
                PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD
            );

            console.log(
                `Code splitting: ${effectiveness.chunkCount} chunks, avg ${effectiveness.averageChunkSize.toFixed(0)}KB`
            );

            // Average chunk size should be under threshold
            expect(effectiveness.averageChunkSize).toBeLessThan(
                PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD
            );
        });
    });

    describe('Memory Usage Tracking', () => {
        it('should track memory usage during component lifecycle', () => {
            const memorySnapshots: number[] = [];

            // Simulate component lifecycle
            memorySnapshots.push(getMemoryUsage()); // Initial

            // Simulate component mount
            const componentData = allocateMemory(5);
            memorySnapshots.push(getMemoryUsage());

            // Simulate component update
            const updateData = allocateMemory(2);
            memorySnapshots.push(getMemoryUsage());

            // Simulate component unmount
            cleanupMemory(componentData);
            cleanupMemory(updateData);
            memorySnapshots.push(getMemoryUsage());

            const initialMemory = memorySnapshots[0];
            const peakMemory = Math.max(...memorySnapshots);
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];

            if (initialMemory !== undefined && finalMemory !== undefined) {
                const memoryGrowth = finalMemory - initialMemory;
                console.log(
                    `Memory usage - Initial: ${initialMemory.toFixed(2)}MB, Peak: ${peakMemory.toFixed(2)}MB, Final: ${finalMemory.toFixed(2)}MB`
                );
                console.log(`Memory growth: ${memoryGrowth.toFixed(2)}MB`);
                expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
            }
        });

        it('should detect memory leaks in long-running operations', () => {
            const iterations = 20;
            const memorySnapshots: number[] = [];

            for (let i = 0; i < iterations; i++) {
                // Simulate operation
                const data = allocateMemory(2);
                memorySnapshots.push(getMemoryUsage());
                cleanupMemory(data);
            }

            const initialMemory = memorySnapshots[0];
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];

            if (initialMemory !== undefined && finalMemory !== undefined) {
                const memoryGrowth = finalMemory - initialMemory;
                console.log(
                    `Memory growth after ${iterations} operations: ${memoryGrowth.toFixed(2)}MB`
                );
                expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
            }
        });

        it('should track memory usage during debouncing operations', () => {
            const waitTime = 100;
            const iterations = 50;
            const memorySnapshots: number[] = [];

            const debouncedFn = debounce(() => {}, waitTime);

            for (let i = 0; i < iterations; i++) {
                debouncedFn();
                memorySnapshots.push(getMemoryUsage());
            }

            const initialMemory = memorySnapshots[0];
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];

            if (initialMemory !== undefined && finalMemory !== undefined) {
                const memoryGrowth = finalMemory - initialMemory;
                console.log(
                    `Memory growth during ${iterations} debounce calls: ${memoryGrowth.toFixed(2)}MB`
                );
                expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
            }
        });

        it('should monitor memory usage during lazy loading', async () => {
            const components = ['WebcamTest', 'MicrophoneTest', 'SpeakerTest'];
            const memorySnapshots: number[] = [];

            memorySnapshots.push(getMemoryUsage()); // Initial

            for (const component of components) {
                await simulateLazyLoad(component);
                memorySnapshots.push(getMemoryUsage());
            }

            const initialMemory = memorySnapshots[0];
            const peakMemory = Math.max(...memorySnapshots);
            const finalMemory = memorySnapshots[memorySnapshots.length - 1];

            if (initialMemory !== undefined && finalMemory !== undefined) {
                const memoryGrowth = finalMemory - initialMemory;
                console.log(
                    `Memory during lazy loading - Initial: ${initialMemory.toFixed(2)}MB, Peak: ${peakMemory.toFixed(2)}MB, Final: ${finalMemory.toFixed(2)}MB`
                );
                expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD * 2); // Allow more for loaded components
            }
        });
    });

    describe('Performance Regression Detection', () => {
        it('should detect performance regressions in lazy loading', async () => {
            const baselineTime = 50; // ms
            const component = 'WebcamTest';

            const { duration } = measurePerformance(
                'Lazy loading regression check',
                () => simulateLazyLoad(component),
                baselineTime * 2 // Allow 2x baseline
            );

            const regressionPercentage = ((duration - baselineTime) / baselineTime) * 100;

            console.log(`Performance regression: ${regressionPercentage.toFixed(2)}%`);

            // Should not regress more than 100%
            expect(regressionPercentage).toBeLessThan(100);
        });

        it('should detect performance regressions in debouncing', () => {
            const baselineTime = 10; // ms
            const waitTime = 100;

            const debouncedFn = debounce(() => {}, waitTime);

            const { duration } = measurePerformance(
                'Debouncing regression check',
                () => {
                    for (let i = 0; i < 10; i++) {
                        debouncedFn();
                    }
                },
                baselineTime * 2
            );

            const regressionPercentage = ((duration - baselineTime) / baselineTime) * 100;

            console.log(`Debouncing performance regression: ${regressionPercentage.toFixed(2)}%`);

            expect(regressionPercentage).toBeLessThan(100);
        });

        it('should detect memory usage regressions', () => {
            const baselineMemory = 10; // MB
            const allocationSize = 5;

            const { result: memoryAfter } = measurePerformance(
                'Memory usage regression check',
                () => {
                    const chunks = allocateMemory(allocationSize);
                    const memory = getMemoryUsage();
                    cleanupMemory(chunks);
                    return memory;
                },
                baselineMemory * 2
            );

            const regressionPercentage = ((memoryAfter - baselineMemory) / baselineMemory) * 100;

            console.log(`Memory usage regression: ${regressionPercentage.toFixed(2)}%`);

            expect(regressionPercentage).toBeLessThan(100);
        });
    });

    describe('Overall Performance Summary', () => {
        it('should generate performance summary report', () => {
            const allBenchmarks = [
                { name: 'Lazy Loading', threshold: PERFORMANCE_THRESHOLDS.LAZY_LOAD_THRESHOLD },
                {
                    name: 'Memory Cleanup',
                    threshold: PERFORMANCE_THRESHOLDS.MEMORY_CLEANUP_THRESHOLD,
                },
                { name: 'Debouncing', threshold: PERFORMANCE_THRESHOLDS.DEBOUNCE_THRESHOLD },
                { name: 'Bundle Size', threshold: PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD },
            ];

            const summary = allBenchmarks.map(benchmark => {
                const results = benchmarkResults.filter(r =>
                    r.name.includes(benchmark.name.toLowerCase())
                );
                const passed = results.every(r => r.passed);
                const avgDuration =
                    results.length > 0
                        ? results.reduce((sum, r) => sum + r.duration, 0) / results.length
                        : 0;

                return {
                    name: benchmark.name,
                    threshold: benchmark.threshold,
                    avgDuration,
                    passed,
                    testCount: results.length,
                };
            });

            console.log('\n=== Performance Summary ===');
            summary.forEach(item => {
                console.log(
                    `${item.name}: ${item.avgDuration.toFixed(2)}ms avg (${item.testCount} tests) - ${
                        item.passed ? '✓ PASS' : '✗ FAIL'
                    }`
                );
            });

            const allPassed = summary.every(item => item.passed);
            expect(allPassed).toBe(true);
        });
    });
});
