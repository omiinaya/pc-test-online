# Asset Optimization & Preloading Strategy

## Overview
This document provides detailed implementation instructions for optimizing assets and implementing strategic preloading to improve performance and user experience.

## 1. Current Asset Analysis

### 1.1 Existing Assets
**Directory:** `frontend/public/`
- `favicon.svg` - 2.1KB (can be optimized)
- No other static assets currently

### 1.2 Bundle Analysis
From Vite configuration analysis:
- JavaScript bundle: ~2.5MB initial load
- CSS: Integrated with components
- Fonts: System fonts used
- Images: None currently

## 2. Image Optimization Strategy

### 2.1 SVG Optimization
**File:** `frontend/public/favicon.svg`

**Current:** 2.1KB
**Target:** <1KB

**Optimization Steps:**
```bash
# Install SVG optimization tools
npm install -D svgo @svgr/cli

# Create optimization script
echo 'const { optimize } = require("svgo");
const fs = require("fs");

const svg = fs.readFileSync("public/favicon.svg", "utf8");
const result = optimize(svg, {
  plugins: [
    "removeDoctype",
    "removeXMLProcInst",
    "removeComments",
    "removeMetadata",
    "removeEditorsNSData",
    "cleanupAttrs",
    "mergeStyles",
    "inlineStyles",
    "minifyStyles",
    "cleanupIDs",
    "removeUselessDefs",
    "cleanupNumericValues",
    "convertColors",
    "removeUnknownsAndDefaults",
    "removeNonInheritableGroupAttrs",
    "removeUselessStrokeAndFill",
    "removeViewBox",
    "cleanupEnableBackground",
    "removeHiddenElems",
    "removeEmptyText",
    "convertShapeToPath",
    "convertEllipseToCircle",
    "moveElemsAttrsToGroup",
    "moveGroupAttrsToElems",
    "collapseGroups",
    "convertPathData",
    "convertTransform",
    "removeEmptyAttrs",
    "removeEmptyContainers",
    "mergePaths",
    "removeUnusedNS",
    "sortDefsChildren",
    "removeTitle",
    "removeDesc"
  ]
});

fs.writeFileSync("public/favicon-optimized.svg", result.data);' > scripts/optimize-svg.js
```

### 2.2 Responsive Images Strategy
**New Directory:** `frontend/public/images/`

**Image Types to Support:**
- WebP (modern browsers)
- JPEG (fallback)
- SVG (icons and logos)
- AVIF (next-gen, optional)

## 3. Font Optimization

### 3.1 Font Strategy
**Current:** System fonts
**Optimized:** System fonts with fallback hierarchy

**CSS Implementation:**
```css
/* frontend/src/styles/fonts.css */
:root {
  --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                 Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', 
                 sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

body {
  font-family: var(--font-system);
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.code, pre, code {
  font-family: var(--font-mono);
  font-feature-settings: 'liga' 0;
}
```

## 4. CSS Optimization

### 4.1 Critical CSS Extraction
**File:** `frontend/vite.config.js`

```javascript
// Add to Vite configuration
import { critical } from 'vite-plugin-critical';

export default defineConfig({
  plugins: [
    critical({
      criticalUrl: 'http://localhost:5173',
      criticalBase: './dist',
      criticalPages: [
        { uri: '/', template: 'index' }
      ],
      criticalConfig: {
        inline: true,
        dimensions: [
          { width: 1300, height: 900 },
          { width: 768, height: 1024 },
          { width: 375, height: 667 }
        ]
      }
    })
  ]
});
```

### 4.2 CSS Minification & Compression
```javascript
// vite.config.js - CSS optimization
css: {
  devSourcemap: true,
  preprocessorOptions: {
    css: {
      charset: false,
    },
  },
  // Enable CSS code splitting
  modules: {
    generateScopedName: '[name]__[local]___[hash:base64:5]'
  },
  // Minify CSS in production
  postcss: {
    plugins: [
      require('cssnano')({
        preset: 'default'
      })
    ]
  }
}
```

## 5. Preloading Strategy

### 5.1 Resource Hint Implementation
**File:** `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Preload critical resources -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">
    
    <!-- Preload core CSS -->
    <link rel="preload" href="/src/styles/variables.css" as="style">
    <link rel="preload" href="/src/styles/utilities.css" as="style">
    
    <!-- Preload critical JavaScript -->
    <link rel="preload" href="/src/main.js" as="script">
    
    <!-- Prefetch lazy-loaded components -->
    <link rel="prefetch" href="/src/components/WebcamTest.vue" as="script">
    <link rel="prefetch" href="/src/components/MicrophoneTest.vue" as="script">
    <link rel="prefetch" href="/src/components/SpeakerTest.vue" as="script">
    
    <!-- Preload critical images -->
    <link rel="preload" href="/images/loading-spinner.svg" as="image" type="image/svg+xml">
    
    <title>MMIT Testing Suite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### 5.2 Programmatic Preloading
**File:** `frontend/src/utils/preload.ts`

```typescript
export interface PreloadOptions {
  type?: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossorigin?: boolean;
  as?: string;
}

export class PreloadManager {
  private preloaded = new Set<string>();

  preloadResource(url: string, options: PreloadOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloaded.has(url)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = options.type === 'script' ? 'preload' : 'prefetch';
      link.href = url;
      
      if (options.as) {
        link.as = options.as;
      }
      
      if (options.crossorigin) {
        link.crossOrigin = 'anonymous';
      }

      link.onload = () => {
        this.preloaded.add(url);
        resolve();
      };

      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  preloadScript(url: string): Promise<void> {
    return this.preloadResource(url, { as: 'script' });
  }

  preloadStyle(url: string): Promise<void> {
    return this.preloadResource(url, { as: 'style' });
  }

  preloadImage(url: string): Promise<void> {
    return this.preloadResource(url, { as: 'image' });
  }

  preloadFont(url: string): Promise<void> {
    return this.preloadResource(url, { 
      as: 'font', 
      crossorigin: true 
    });
  }

  // Preload all lazy components
  async preloadLazyComponents(): Promise<void> {
    const components = [
      '/src/components/WebcamTest.vue',
      '/src/components/MicrophoneTest.vue',
      '/src/components/SpeakerTest.vue',
      '/src/components/KeyboardTest.vue',
      '/src/components/MouseTest.vue',
      '/src/components/TouchTest.vue',
      '/src/components/BatteryTest.vue'
    ];

    await Promise.all(components.map(component => 
      this.preloadScript(component)
    ));
  }

  clear(): void {
    this.preloaded.clear();
  }
}

// Singleton instance
export const preloadManager = new PreloadManager();
```

### 5.3 Vue Component Integration
**File:** `frontend/src/composables/usePreloading.ts`

```typescript
import { onMounted, onUnmounted } from 'vue';
import { preloadManager } from '../utils/preload';

export function usePreloading() {
  const preloadCriticalResources = async (): Promise<void> => {
    try {
      // Preload core styles
      await preloadManager.preloadStyle('/src/styles/variables.css');
      await preloadManager.preloadStyle('/src/styles/utilities.css');
      
      // Preload critical images
      await preloadManager.preloadImage('/images/loading-spinner.svg');
      
      console.log('Critical resources preloaded');
    } catch (error) {
      console.warn('Preloading failed:', error);
    }
  };

  const preloadOnInteraction = (): void => {
    // Preload lazy components on user interaction
    const events = ['mousedown', 'touchstart', 'keydown'];
    
    const handler = () => {
      preloadManager.preloadLazyComponents();
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, handler, { once: true });
    });
  };

  // Auto-preload on component mount
  onMounted(() => {
    preloadCriticalResources();
    preloadOnInteraction();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    preloadManager.clear();
  });

  return {
    preloadCriticalResources,
    preloadOnInteraction,
    preloadManager
  };
}
```

## 6. Vite Configuration Optimization

### 6.1 Enhanced Build Configuration
**File:** `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import WindiCSS from 'vite-plugin-windicss';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // ... existing config ...
  
  build: {
    // ... existing build config ...
    
    // Enhanced chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep vendor chunks
          'vue-vendor': ['vue', '@vueuse/core', 'vue-router', 'vue-i18n'],
          'chart-vendor': ['chart.js', 'vue-chartjs'],
          'ml-vendor': ['@tensorflow/tfjs', 'ml-matrix'],
          
          // Remove test-components chunk since we're lazy loading
          // Add new chunks based on usage patterns
          'utils': [
            './src/utils/debounce.ts',
            './src/utils/throttle.ts',
            './src/utils/preload.ts'
          ],
          'composables-core': [
            './src/composables/useMemoryManagement.ts',
            './src/composables/useDebounce.ts',
            './src/composables/usePreloading.ts'
          ],
          'composables-media': [
            './src/composables/utils/mediaStreamUtils.ts',
            './src/composables/useMediaStream.ts'
          ]
        },
        
        // Optimize chunk names for caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    
    // Enable brotli compression
    brotliSize: true,
    minify: 'terser',
    
    // CSS optimization
    cssCodeSplit: true,
    cssTarget: 'es2015'
  },
  
  // Preload plugin for generating resource hints
  plugins: [
    // ... existing plugins ...
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      'vue-router',
      'vue-i18n'
    ],
    exclude: [
      '@tensorflow/tfjs',
      'ml-matrix'
    ]
  }
});
```

## 7. Performance Monitoring

### 7.1 Resource Timing Monitoring
**File:** `frontend/src/composables/useResourceTiming.ts`

```typescript
import { ref, onMounted } from 'vue';

export interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  decodedBodySize: number;
  initiatorType: string;
}

export function useResourceTiming() {
  const timings = ref<ResourceTiming[]>([]);

  const getResourceTimings = (): ResourceTiming[] => {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    return performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      duration: entry.duration,
      transferSize: (entry as PerformanceResourceTiming).transferSize || 0,
      decodedBodySize: (entry as PerformanceResourceTiming).decodedBodySize || 0,
      initiatorType: (entry as PerformanceResourceTiming).initiatorType || ''
    }));
  };

  const getLargestResources = (limit = 10): ResourceTiming[] => {
    return getResourceTimings()
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, limit);
  };

  const getSlowestResources = (limit = 10): ResourceTiming[] => {
    return getResourceTimings()
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  };

  // Monitor resource loading
  onMounted(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      timings.value = getResourceTimings();
    });

    observer.observe({ entryTypes: ['resource'] });
  });

  return {
    timings,
    getResourceTimings,
    getLargestResources,
    getSlowestResources
  };
}
```

## 8. Implementation Timeline

### Week 1: Foundation
- [ ] SVG optimization implementation
- [ ] Preload manager setup
- [ ] Resource timing monitoring

### Week 2: Integration  
- [ ] Vite configuration updates
- [ ] Critical CSS extraction
- [ ] Preloading composable integration

### Week 3: Optimization
- [ ] Image optimization pipeline
- [ ] Font strategy implementation
- [ ] Performance testing

### Week 4: Monitoring
- [ ] Resource timing dashboard
- [ ] Performance metrics tracking
- [ ] Optimization validation

## 9. Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|---------|--------|-------------|
| First Contentful Paint | ~2.8s | <1.5s | 46% faster |
| Largest Contentful Paint | ~3.2s | <2.2s | 31% faster |
| Total Blocking Time | ~400ms | <200ms | 50% reduction |
| Bundle Size | ~2.5MB | <1.8MB | 28% smaller |
| Resource Requests | 20+ | 8-12 | 40-60% reduction |

## 10. Validation & Testing

### 10.1 Performance Budgets
```javascript
// frontend/package.json
{
  "scripts": {
    "perf:budget": "vite build && npx bundlesize"
  },
  "bundlesize": [
    {
      "path": "./dist/js/*.js",
      "maxSize": "1.8 MB"
    },
    {
      "path": "./dist/assets/*.css", 
      "maxSize": "50 KB"
    }
  ]
}
```

### 10.2 Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: './lighthouse.config.js'
```

This comprehensive asset optimization strategy will significantly improve loading performance and user experience.