# Phase 2: Performance Optimization - Implementation Guide

## Overview
This document provides detailed implementation instructions for Phase 2 performance optimizations focused on lazy loading, memory management, debouncing, and asset optimization.

## 1. Lazy Loading Implementation

### Current Issue
All device test components are imported directly in [`TestsPage.vue`](frontend/src/views/TestsPage.vue:1-20), causing unnecessary bundle bloat.

### Implementation Steps

#### 1.1 Modify TestsPage.vue Imports
**File:** [`frontend/src/views/TestsPage.vue`](frontend/src/views/TestsPage.vue)

**Current Code (Lines 1-20):**
```javascript
import WebcamTest from '../components/WebcamTest.vue';
import MicrophoneTest from '../components/MicrophoneTest.vue';
import SpeakerTest from '../components/SpeakerTest.vue';
import KeyboardTest from '../components/KeyboardTest.vue';
import MouseTest from '../components/MouseTest.vue';
import TouchTest from '../components/TouchTest.vue';
import BatteryTest from '../components/BatteryTest.vue';
import TestsCompleted from '../components/TestsCompleted.vue';
```

**New Implementation:**
```javascript
import { defineAsyncComponent } from 'vue';

// Lazy load device test components
const WebcamTest = defineAsyncComponent(() =>
  import('../components/WebcamTest.vue')
);
const MicrophoneTest = defineAsyncComponent(() =>
  import('../components/MicrophoneTest.vue')
);
const SpeakerTest = defineAsyncComponent(() =>
  import('../components/SpeakerTest.vue')
);
const KeyboardTest = defineAsyncComponent(() =>
  import('../components/KeyboardTest.vue')
);
const MouseTest = defineAsyncComponent(() =>
  import('../components/MouseTest.vue')
);
const TouchTest = defineAsyncComponent(() =>
  import('../components/TouchTest.vue')
);
const BatteryTest = defineAsyncComponent(() =>
  import('../components/BatteryTest.vue')
);
const TestsCompleted = defineAsyncComponent(() =>
  import('../components/TestsCompleted.vue')
);
```

#### 1.2 Add Loading Components
```javascript
const WebcamTest = defineAsyncComponent({
  loader: () => import('../components/WebcamTest.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 3000
});
```

#### 1.3 Update Vite Configuration
**File:** [`frontend/vite.config.js`](frontend/vite.config.js)

Remove manual chunking for test components since lazy loading will handle this automatically.

## 2. Memory Leak Prevention

### 2.1 Enhanced Media Stream Cleanup
**File:** [`frontend/src/composables/useMediaStream.ts`](frontend/src/composables/useMediaStream.ts)

**Current Cleanup (Lines 74-78):**
```typescript
const cleanup = (): void => {
  stopStream();
  error.value = null;
  loading.value = false;
};
```

**Enhanced Implementation:**
```typescript
const cleanup = (): void => {
  // Stop all media tracks
  if (stream.value) {
    stream.value.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    stream.value = null;
  }
  
  // Clear all timeouts and intervals
  if (switchDebounceTimer) {
    clearTimeout(switchDebounceTimer);
    switchDebounceTimer = null;
  }
  
  // Reset state
  error.value = null;
  loading.value = false;
  
  // Clean up WebRTC compatibility layer
  if (webrtcCompat) {
    webrtcCompat.cleanup();
  }
};
```

### 2.2 Create Memory Management Composable
**New File:** `frontend/src/composables/useMemoryManagement.ts`

```typescript
import { onUnmounted, ref } from 'vue';

interface MemoryResource {
  type: 'timeout' | 'interval' | 'event' | 'stream' | 'connection';
  id: number | string;
  cleanup: () => void;
}

export function useMemoryManagement() {
  const resources = ref<MemoryResource[]>([]);
  let resourceId = 0;

  const trackResource = (cleanup: () => void, type: MemoryResource['type']) => {
    const id = resourceId++;
    resources.value.push({ type, id, cleanup });
    return id;
  };

  const untrackResource = (id: number) => {
    const index = resources.value.findIndex(r => r.id === id);
    if (index > -1) {
      resources.value.splice(index, 1);
    }
  };

  const cleanupAll = () => {
    resources.value.forEach(resource => {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn('Error cleaning up resource:', error);
      }
    });
    resources.value = [];
  };

  // Auto-cleanup on component unmount
  onUnmounted(cleanupAll);

  return {
    trackResource,
    untrackResource,
    cleanupAll,
    resources
  };
}
```

## 3. Debouncing & Throttling Implementation

### 3.1 Resize Event Debouncing
**File:** [`frontend/src/App.vue`](frontend/src/App.vue)

**Current Implementation (Lines 894-902):**
```javascript
handleResize() {
  this.isMobile = window.innerWidth <= 768;
  console.log(
    'handleResize - window.innerWidth:',
    window.innerWidth,
    'isMobile:',
    this.isMobile
  );
},
```

**Enhanced Implementation:**
```javascript
import { debounce } from '../utils/debounce';

// In setup() or data()
const debouncedHandleResize = debounce(() => {
  this.isMobile = window.innerWidth <= 768;
  console.log(
    'Debounced resize - window.innerWidth:',
    window.innerWidth,
    'isMobile:',
    this.isMobile
  );
}, 250);

handleResize() {
  debouncedHandleResize();
},
```

### 3.2 Device Switching Debouncing
**File:** [`frontend/src/views/TestsPage.vue`](frontend/src/views/TestsPage.vue)

**Current Implementation (Lines 419-446):**
```javascript
debouncedSetActiveTest(testType) {
  if (this.isSwitching) return;
  if (this.switchDebounceTime) {
    clearTimeout(this.switchDebounceTime);
  }
  this.isSwitching = true;
  this.setActiveTest(testType);
  this.switchDebounceTime = setTimeout(() => {
    this.isSwitching = false;
    this.switchDebounceTime = null;
  }, 200);
}
```

**Enhanced Implementation:**
```javascript
import { debounce } from '../utils/debounce';

// In setup()
const debouncedSetActiveTest = debounce((testType) => {
  setActiveTest(testType);
}, 200, { leading: true, trailing: false });

// Replace method with:
setActiveTest(testType) {
  if (this.activeTest !== testType) {
    this.stopTimer(this.activeTest);
  }
  this.activeTest = testType;
  this.startTimer(testType);
}
```

## 4. Asset Optimization Strategy

### 4.1 Image Optimization
**Directory:** `frontend/public/`

- Convert all SVG assets to optimized format
- Implement responsive images with srcset
- Add lazy loading for images

### 4.2 Font Optimization
- Subset fonts to include only necessary characters
- Implement font-display: swap in CSS
- Preload critical fonts

### 4.3 CSS Optimization
**File:** `frontend/src/styles/`

- Extract critical CSS for above-the-fold content
- Minify and compress CSS
- Remove unused CSS with PurgeCSS

## 5. Performance Monitoring Hooks

### 5.1 Enhanced Performance Composable
**File:** [`frontend/src/composables/usePerformance.ts`](frontend/src/composables/usePerformance.ts)

**Add these methods:**
```typescript
const trackBundleSize = async () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    
    metrics.value.bundleSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  }
};

const trackMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    metrics.value.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  }
};
```

## 6. Performance Benchmark Tests

### 6.1 Create Benchmark Suite
**New File:** `frontend/tests/performance/benchmark.spec.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mount } from '@vue/test-utils';
import TestsPage from '../../src/views/TestsPage.vue';

describe('Performance Benchmarks', () => {
  it('should load initial bundle under 1.5MB', async () => {
    const start = performance.now();
    const wrapper = mount(TestsPage);
    const loadTime = performance.now() - start;
    
    expect(loadTime).toBeLessThan(1000); // < 1 second
  });

  it('should lazy load components efficiently', async () => {
    const memoryBefore = performance.memory?.usedJSHeapSize || 0;
    
    // Trigger lazy loading
    // Add test logic here
    
    const memoryAfter = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = memoryAfter - memoryBefore;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB increase
  });
});
```

## Expected Performance Improvements

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Bundle Size | ~2.5MB | <1.5MB | 40% reduction |
| LCP | ~2.8s | <2.5s | 11% improvement |
| Memory Usage | ~150MB | <100MB | 33% reduction |
| Component Load Time | ~500ms | <200ms | 60% improvement |

## Implementation Timeline

1. **Week 1**: Lazy Loading Implementation
2. **Week 2**: Memory Management & Cleanup
3. **Week 3**: Debouncing & Performance Monitoring
4. **Week 4**: Asset Optimization & Benchmarking

## Risk Mitigation

- Test each optimization independently
- Implement feature flags for gradual rollout
- Monitor performance metrics continuously
- Maintain backward compatibility

## Success Metrics

- 40% reduction in initial bundle size
- 50% reduction in memory leaks
- 30% improvement in Core Web Vitals
- 95% test coverage for performance features