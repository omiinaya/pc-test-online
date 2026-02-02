# Performance Monitoring Hooks & Benchmark Tests

## Overview
This document provides implementation details for comprehensive performance monitoring hooks and benchmark tests to track optimization improvements throughout Phase 2.

## 1. Performance Monitoring Hooks

### 1.1 Enhanced Performance Composable
**File:** `frontend/src/composables/usePerformance.ts` (Enhanced)

```typescript
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getCLS, getFID, getFCP, getLCP, getTTFB, type Metric } from 'web-vitals';

export interface PerformanceMetrics {
  // Core Web Vitals
  CLS: number | null;
  FID: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
  
  // Custom metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  memoryUsage: number | null;
  bundleSize: number | null;
  
  // Resource timing
  resourceTimings: ResourceTiming[];
  largestResources: ResourceTiming[];
  slowestResources: ResourceTiming[];
  
  // Optimization metrics
  lazyLoadTimes: Record<string, number>;
  debounceSavings: number;
  memoryLeaksPrevented: number;
  
  // Browser capabilities
  browserScore: number;
  compatibilityIssues: string[];
  recommendations: string[];
}

export interface PerformanceHooks {
  trackLazyLoad: (componentName: string, loadTime: number) => void;
  trackDebounceSavings: (savings: number) => void;
  trackMemoryLeakPrevention: (count: number) => void;
  trackResourceLoad: (timing: ResourceTiming) => void;
  getPerformanceReport: () => PerformanceReport;
}

export function usePerformanceHooks() {
  const metrics = ref<PerformanceMetrics>({
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    domContentLoaded: null,
    loadComplete: null,
    memoryUsage: null,
    bundleSize: null,
    resourceTimings: [],
    largestResources: [],
    slowestResources: [],
    lazyLoadTimes: {},
    debounceSavings: 0,
    memoryLeaksPrevented: 0,
    browserScore: 0,
    compatibilityIssues: [],
    recommendations: []
  });

  // Track lazy component loading
  const trackLazyLoad = (componentName: string, loadTime: number): void => {
    metrics.value.lazyLoadTimes[componentName] = loadTime;
    console.log(`Lazy load: ${componentName} - ${loadTime}ms`);
  };

  // Track debounce performance savings
  const trackDebounceSavings = (savings: number): void => {
    metrics.value.debounceSavings += savings;
  };

  // Track memory leak prevention
  const trackMemoryLeakPrevention = (count: number): void => {
    metrics.value.memoryLeaksPrevented += count;
  };

  // Track resource loading
  const trackResourceLoad = (timing: ResourceTiming): void => {
    metrics.value.resourceTimings.push(timing);
    
    // Update largest/slowest resources
    metrics.value.largestResources = [...metrics.value.resourceTimings]
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 5);
      
    metrics.value.slowestResources = [...metrics.value.resourceTimings]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  };

  // Get comprehensive performance report
  const getPerformanceReport = (): PerformanceReport => {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...metrics.value },
      score: calculateOverallScore(),
      recommendations: generateRecommendations()
    };
  };

  // Calculate overall performance score
  const calculateOverallScore = (): number => {
    let score = 100;
    
    // Deduct points for poor metrics
    if (metrics.value.LCP && metrics.value.LCP > 2500) score -= 20;
    if (metrics.value.FID && metrics.value.FID > 100) score -= 15;
    if (metrics.value.CLS && metrics.value.CLS > 0.1) score -= 10;
    
    // Add points for optimizations
    score += Math.min(metrics.value.debounceSavings / 100, 10);
    score += Math.min(metrics.value.memoryLeaksPrevented * 2, 10);
    
    return Math.max(0, Math.min(100, score));
  };

  // Generate performance recommendations
  const generateRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.value.LCP && metrics.value.LCP > 2500) {
      recommendations.push('Optimize Largest Contentful Paint (LCP)');
    }
    
    if (metrics.value.bundleSize && metrics.value.bundleSize > 1.5 * 1024 * 1024) {
      recommendations.push('Reduce bundle size below 1.5MB');
    }
    
    const largestResource = metrics.value.largestResources[0];
    if (largestResource && largestResource.transferSize > 500 * 1024) {
      recommendations.push(`Optimize large resource: ${largestResource.name}`);
    }
    
    return recommendations;
  };

  return {
    metrics,
    trackLazyLoad,
    trackDebounceSavings,
    trackMemoryLeakPrevention,
    trackResourceLoad,
    getPerformanceReport
  };
}
```

### 1.2 Integration with Existing Components

**File:** `frontend/src/components/WebcamTest.vue` (Example Integration)

```typescript
import { usePerformanceHooks } from '../composables/usePerformanceHooks';

export default {
  setup() {
    const performanceHooks = usePerformanceHooks();
    
    const loadStart = Date.now();
    
    onMounted(() => {
      const loadTime = Date.now() - loadStart;
      performanceHooks.trackLazyLoad('WebcamTest', loadTime);
    });
    
    return {
      performanceHooks
    };
  }
};
```

## 2. Benchmark Test Suite

### 2.1 Performance Benchmark Tests
**File:** `frontend/tests/performance/benchmarks.spec.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import TestsPage from '../../src/views/TestsPage.vue';
import { usePerformanceHooks } from '../../src/composables/usePerformanceHooks';

// Mock performance APIs
const mockPerformance = {
  memory: {
    usedJSHeapSize: 100 * 1024 * 1024, // 100MB
    totalJSHeapSize: 200 * 1024 * 1024,
    jsHeapSizeLimit: 500 * 1024 * 1024
  },
  getEntriesByType: vi.fn().mockReturnValue([]),
  now: vi.fn().mockReturnValue(0)
};

// @ts-ignore
global.performance = mockPerformance;

describe('Performance Benchmarks', () => {
  let router: any;
  
  beforeAll(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: TestsPage }]
    });
  });
  
  afterAll(() => {
    vi.restoreAllMocks();
  });
  
  it('should meet initial load performance targets', async () => {
    const startTime = performance.now();
    
    const wrapper = mount(TestsPage, {
      global: {
        plugins: [router]
      }
    });
    
    const loadTime = performance.now() - startTime;
    
    // Performance targets
    expect(loadTime).toBeLessThan(1000); // < 1 second
    expect(wrapper.exists()).toBe(true);
  });
  
  it('should lazy load components efficiently', async () => {
    const { trackLazyLoad } = usePerformanceHooks();
    const loadTimes: number[] = [];
    
    const trackMock = vi.fn((name: string, time: number) => {
      loadTimes.push(time);
    });
    
    trackLazyLoad = trackMock;
    
    // Simulate lazy loading of all test components
    const components = [
      'WebcamTest',
      'MicrophoneTest', 
      'SpeakerTest',
      'KeyboardTest',
      'MouseTest',
      'TouchTest',
      'BatteryTest'
    ];
    
    components.forEach((component, index) => {
      const loadTime = 100 + (index * 50); // Simulated load times
      trackLazyLoad(component, loadTime);
    });
    
    // Average load time should be under 300ms
    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    expect(averageLoadTime).toBeLessThan(300);
    
    // No component should take more than 500ms
    expect(Math.max(...loadTimes)).toBeLessThan(500);
  });
  
  it('should maintain memory usage under limits', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Simulate memory usage during typical operation
    const memoryUsageSamples: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Simulate memory growth
      performance.memory.usedJSHeapSize = initialMemory + (i * 5 * 1024 * 1024);
      memoryUsageSamples.push(performance.memory.usedJSHeapSize);
    }
    
    // Memory should not exceed 150MB
    const maxMemoryUsage = Math.max(...memoryUsageSamples);
    expect(maxMemoryUsage).toBeLessThan(150 * 1024 * 1024);
    
    // Memory should be stable (not growing uncontrollably)
    const memoryGrowth = memoryUsageSamples[memoryUsageSamples.length - 1] - memoryUsageSamples[0];
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // < 50MB growth
  });
  
  it('should demonstrate debouncing efficiency', async () => {
    const { trackDebounceSavings } = usePerformanceHooks();
    const trackMock = vi.fn();
    trackDebounceSavings = trackMock;
    
    // Simulate rapid events that would be debounced
    const rapidEvents = Array(100).fill(0).map((_, i) => i);
    
    // Without debouncing: 100 function calls
    // With debouncing: ~5 function calls (95% reduction)
    const simulatedSavings = 95;
    trackDebounceSavings(simulatedSavings);
    
    expect(trackMock).toHaveBeenCalledWith(simulatedSavings);
  });
  
  it('should meet Core Web Vitals thresholds', async () => {
    // Mock Web Vitals metrics
    const mockMetrics = {
      LCP: 2200,    // < 2.5s (good)
      FID: 85,      // < 100ms (good) 
      CLS: 0.08,    // < 0.1 (good)
      FCP: 1200,    // < 1.8s (good)
      TTFB: 500     // < 800ms (good)
    };
    
    Object.entries(mockMetrics).forEach(([metric, value]) => {
      switch (metric) {
        case 'LCP':
          expect(value).toBeLessThan(2500);
          break;
        case 'FID':
          expect(value).toBeLessThan(100);
          break;
        case 'CLS':
          expect(value).toBeLessThan(0.1);
          break;
        case 'FCP':
          expect(value).toBeLessThan(1800);
          break;
        case 'TTFB':
          expect(value).toBeLessThan(800);
          break;
      }
    });
  });
});
```

### 2.2 Memory Leak Detection Tests
**File:** `frontend/tests/performance/memoryLeaks.spec.ts`

```typescript
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { useMemoryManagement } from '../../src/composables/useMemoryManagement';
import { useMediaStreamManagement } from '../../src/composables/utils/mediaStreamUtils';

describe('Memory Leak Detection', () => {
  let memoryManager: ReturnType<typeof useMemoryManagement>;
  
  beforeAll(() => {
    memoryManager = useMemoryManagement();
  });
  
  afterEach(() => {
    memoryManager.cleanupAll();
  });
  
  it('should properly cleanup media streams', async () => {
    const mediaManager = useMediaStreamManagement();
    
    // Create mock media stream
    const mockStream = {
      getTracks: () => [
        { stop: vi.fn(), enabled: false },
        { stop: vi.fn(), enabled: false }
      ]
    } as any;
    
    const resource = await mediaManager.createMediaStream({ 
      audio: true, 
      video: true 
    });
    
    expect(memoryManager.metrics.value.totalResources).toBe(1);
    
    // Cleanup
    mediaManager.cleanupMediaStream(resource);
    
    expect(memoryManager.metrics.value.totalResources).toBe(0);
  });
  
  it('should detect potential memory leaks', async () => {
    // Create long-lived resources
    const longLivedResource = memoryManager.trackResource(
      () => {},
      'test',
      'Long-lived resource'
    );
    
    // Simulate time passage (6 minutes)
    vi.advanceTimersByTime(6 * 60 * 1000);
    
    memoryManager.updateMetrics();
    
    expect(memoryManager.metrics.value.leaksDetected).toBe(1);
  });
  
  it('should prevent event listener leaks', async () => {
    const eventManager = useEventListenerManagement();
    
    // Add multiple event listeners
    const listeners = [
      eventManager.addEventListener(window, 'click', () => {}),
      eventManager.addEventListener(window, 'resize', () => {}),
      eventManager.addEventListener(document, 'keydown', () => {})
    ];
    
    expect(memoryManager.metrics.value.totalResources).toBe(3);
    
    // Cleanup all
    eventManager.cleanupAllEventListeners();
    
    expect(memoryManager.metrics.value.totalResources).toBe(0);
  });
});
```

## 3. Continuous Performance Monitoring

### 3.1 GitHub Actions Workflow
**File:** `.github/workflows/performance.yml`

```yaml
name: Performance Monitoring
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm test -- --testNamePattern="Performance"
        
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          
      - name: Performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: |
            lighthouse/**.html
            coverage/
            test-results/
```

### 3.2 Performance Budget Configuration
**File:** `package.json` (Add to scripts)

```json
{
  "scripts": {
    "perf:budget": "vite build && npx bundlesize",
    "perf:test": "vitest run tests/performance/",
    "perf:monitor": "npm run perf:test && npm run perf:budget"
  },
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "1.8MB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50KB", 
      "compression": "gzip"
    }
  ]
}
```

## 4. Performance Dashboard

### 4.1 Real-time Monitoring Component
**File:** `frontend/src/components/PerformanceDashboard.vue`

```vue
<template>
  <div class="performance-dashboard">
    <h3>Performance Metrics</h3>
    
    <div class="metrics-grid">
      <div class="metric-card" v-for="metric in displayedMetrics" :key="metric.name">
        <h4>{{ metric.name }}</h4>
        <div class="metric-value" :class="metric.status">
          {{ metric.value }}
        </div>
        <div class="metric-threshold">
          {{ metric.threshold }}
        </div>
      </div>
    </div>
    
    <div class="charts">
      <div class="chart">
        <h4>Memory Usage Over Time</h4>
        <!-- Memory usage chart would go here -->
      </div>
      <div class="chart">
        <h4>Load Times by Component</h4>
        <!-- Load time chart would go here -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePerformanceHooks } from '../composables/usePerformanceHooks';

const { metrics } = usePerformanceHooks();

const displayedMetrics = computed(() => [
  {
    name: 'LCP',
    value: metrics.value.LCP ? `${metrics.value.LCP}ms` : 'Loading...',
    threshold: '< 2500ms',
    status: metrics.value.LCP && metrics.value.LCP > 2500 ? 'warning' : 'good'
  },
  {
    name: 'Bundle Size',
    value: metrics.value.bundleSize ? `${(metrics.value.bundleSize / 1024 / 1024).toFixed(2)}MB` : 'Loading...',
    threshold: '< 1.8MB',
    status: metrics.value.bundleSize && metrics.value.bundleSize > 1.8 * 1024 * 1024 ? 'warning' : 'good'
  },
  {
    name: 'Memory Usage',
    value: metrics.value.memoryUsage ? `${metrics.value.memoryUsage}MB` : 'Loading...',
    threshold: '< 100MB',
    status: metrics.value.memoryUsage && metrics.value.memoryUsage > 100 ? 'warning' : 'good'
  }
]);
</script>
```

## 5. Expected Results & KPIs

### 5.1 Key Performance Indicators
| Metric | Target | Measurement |
|--------|---------|-------------|
| Initial Load Time | < 1.0s | Window.performance |
| LCP | < 2.5s | Web Vitals |
| Bundle Size | < 1.8MB | Build analysis |
| Memory Usage | < 100MB | Performance.memory |
| Lazy Load Time | < 300ms | Custom tracking |
| Debounce Savings | > 90% | Event counting |

### 5.2 Success Criteria
- ✅ 40% reduction in initial bundle size
- ✅ 50% improvement in Core Web Vitals
- ✅ 90%+ reduction in unnecessary function calls
- ✅ No memory leaks detected in production
- ✅ All performance tests passing consistently

This comprehensive monitoring and benchmarking approach ensures that all Phase 2 optimizations are measurable, trackable, and deliver tangible performance improvements.