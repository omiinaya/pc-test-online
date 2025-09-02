# CSS Performance Monitoring Plan

## Overview

This document outlines the comprehensive performance monitoring strategy for CSS optimization efforts in the MMIT Lab project. The plan establishes baseline metrics, monitoring tools, and success criteria for measuring the impact of CSS architecture improvements.

## Key Performance Indicators (KPIs)

### 1. Bundle Size Metrics
- **Total CSS Size**: Overall bundle size in KB
- **Gzipped CSS Size**: Compressed bundle size
- **CSS Rules Count**: Number of CSS rules
- **Unused CSS Percentage**: Estimated unused code

### 2. Rendering Performance
- **First Contentful Paint (FCP)**: Time to first CSS-rendered content
- **Largest Contentful Paint (LCP)**: Time to render largest content element
- **Cumulative Layout Shift (CLS)**: Visual stability metric
- **Animation Frame Rate**: FPS during CSS animations

### 3. Maintainability Metrics
- **!important Declarations**: Count of !important usage
- **Specificity Scores**: Average selector specificity
- **Duplicate Rules**: Percentage of duplicate CSS
- **Naming Consistency**: BEM compliance rate

## Baseline Measurements

### Current State (Pre-Optimization)
| Metric | Value | Target |
|--------|-------|--------|
| Total CSS Size | ~45KB | ≤ 36KB (20% reduction) |
| Gzipped CSS Size | ~8KB | ≤ 6.4KB |
| CSS Rules Count | ~850 | ≤ 680 |
| !important Declarations | 17 | 0 |
| Animation FPS | 45-55fps | ≥ 60fps |

### Measurement Tools
1. **Bundle Analysis**: Webpack Bundle Analyzer
2. **Performance**: Lighthouse CI, WebPageTest
3. **CSS Quality**: stylelint, CSS Stats
4. **Visual Testing**: Percy, BackstopJS

## Monitoring Implementation

### 1. Continuous Integration Pipeline

#### Lighthouse CI Configuration
```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: GoogleChrome/lighthouse-ci@v3
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
```

#### Metrics Collection
```json
// lighthouseci.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "unused-css-rules": ["error", {"maxLength": 50}]
      }
    }
  }
}
```

### 2. CSS Bundle Analysis

#### Webpack Configuration
```javascript
// vite.config.js (or webpack.config.js)
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
});
```

#### Bundle Monitoring Script
```javascript
// scripts/css-bundle-monitor.js
const fs = require('fs');
const path = require('path');
const cssStats = require('cssstats');

const cssPath = path.join(__dirname, '../dist/assets/*.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const stats = cssStats(cssContent);

console.log('CSS Bundle Metrics:');
console.log(`- Total Size: ${stats.size} bytes`);
console.log(`- Gzipped Size: ${stats.gzipSize} bytes`);
console.log(`- Rules: ${stats.rules.length}`);
console.log(`- Selectors: ${stats.selectors.total}`);
console.log(`- Specificity: ${stats.selectors.specificity.max}`);
```

### 3. Real User Monitoring (RUM)

#### Core Web Vitals Tracking
```javascript
// frontend/src/utils/web-vitals.js
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  navigator.sendBeacon('/analytics', body);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Performance Budgets

### CSS Budget Limits
| Metric | Warning Threshold | Error Threshold |
|--------|-------------------|-----------------|
| Total CSS Size | 40KB | 45KB |
| Gzipped CSS Size | 7KB | 8KB |
| CSS Rules Count | 700 | 800 |
| Selector Specificity | 20 | 30 |
| Unused CSS | 15% | 25% |

### Animation Performance Budget
| Metric | Target | Minimum |
|--------|--------|---------|
| Animation FPS | 60fps | 50fps |
| Animation Duration | ≤ 300ms | ≤ 500ms |
| Layout Thrashing | 0 occurrences | ≤ 2 occurrences |

## Monitoring Dashboard

### Grafana Dashboard Configuration
```yaml
# dashboards/css-performance.yaml
dashboard:
  title: CSS Performance Metrics
  panels:
    - title: CSS Bundle Size
      type: graph
      targets:
        - expr: css_bundle_size_bytes
          legendFormat: Total Size
        - expr: css_gzip_size_bytes
          legendFormat: Gzipped Size
    
    - title: Core Web Vitals
      type: graph
      targets:
        - expr: web_vitals_lcp
          legendFormat: LCP
        - expr: web_vitals_cls
          legendFormat: CLS
        - expr: web_vitals_fid
          legendFormat: FID
    
    - title: CSS Quality Metrics
      type: stat
      targets:
        - expr: css_important_declarations
          legendFormat: !important Count
        - expr: css_duplicate_rules
          legendFormat: Duplicate Rules
```

## Alerting Strategy

### Critical Alerts (PagerDuty/Slack)
- ❌ CSS bundle size exceeds 45KB
- ❌ LCP > 4 seconds for > 5% of users
- ❌ CLS > 0.25 for > 2% of users
- ❌ Animation jank (FPS < 30) detected

### Warning Alerts (Email/Slack)
- ⚠️ CSS bundle size > 40KB
- ⚠️ !important declarations > 5
- ⚠️ Specificity score > 25
- ⚠️ Unused CSS > 20%

### Informational Reports (Weekly)
- 📊 Weekly performance trends
- 📈 CSS optimization progress
- 🔍 Anomaly detection reports
- 🎯 Success metric achievements

## Testing Strategy

### 1. Automated Regression Tests
```javascript
// tests/css-performance.test.js
describe('CSS Performance', () => {
  test('bundle size within budget', async () => {
    const stats = await getCSSStats();
    expect(stats.size).toBeLessThan(45000);
    expect(stats.gzipSize).toBeLessThan(8000);
  });

  test('no !important declarations', async () => {
    const css = await loadProductionCSS();
    const importantCount = (css.match(/!important/g) || []).length;
    expect(importantCount).toBe(0);
  });
});
```

### 2. Visual Regression Testing
```yaml
# backstop.json
{
  "scenarios": [
    {
      "label": "Test Page Render",
      "url": "http://localhost:3000/tests",
      "referenceUrl": "",
      "readyEvent": "",
      "readySelector": "",
      "delay": 5000,
      "hideSelectors": [],
      "removeSelectors": [],
      "hoverSelector": "",
      "clickSelector": "",
      "postInteractionWait": 0,
      "selectors": ["viewport"],
      "selectorExpansion": true,
      "expect": 0,
      "misMatchThreshold": 0.1
    }
  ]
}
```

### 3. Cross-Browser Testing
```yaml
# browserstack.config.yml
browsers:
  - browser: Chrome
    os: Windows
    os_version: 10
  - browser: Firefox
    os: Windows
    os_version: 10
  - browser: Safari
    os: OS X
    os_version: Big Sur
  - browser: Edge
    os: Windows
    os_version: 10
```

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Set up Lighthouse CI
- [ ] Establish baseline measurements
- [ ] Configure bundle analysis
- [ ] Create performance budgets

### Phase 2: Monitoring (Week 2)
- [ ] Implement RUM tracking
- [ ] Set up alerting system
- [ ] Create Grafana dashboards
- [ ] Configure automated tests

### Phase 3: Optimization (Week 3-4)
- [ ] Continuous performance monitoring
- [ ] Weekly performance reports
- [ ] Alert response procedures
- [ ] Optimization validation

## Success Criteria

### Quantitative Goals
- ✅ CSS bundle size reduction: 20% (45KB → 36KB)
- ✅ !important declarations: 100% removal (17 → 0)
- ✅ Animation performance: 60fps consistently
- ✅ Core Web Vitals: 90+ scores across LCP, FID, CLS

### Qualitative Goals
- ✅ Predictable performance across browsers
- ✅ Sustainable CSS architecture
- ✅ Developer confidence in changes
- ✅ Automated performance guardianship

## Resource Requirements

### Tools & Services
- **Lighthouse CI**: Free (Open Source)
- **Grafana Cloud**: $49/month (Free tier available)
- **WebPageTest**: $99/month (Free tier available)
- **Percy**: $149/month (Free for OSS)
- **BrowserStack**: $249/month (Free for OSS)

### Development Time
- **Setup**: 8-12 hours initial configuration
- **Maintenance**: 2-4 hours weekly monitoring
- **Optimization**: 16-24 hours implementation

## Risk Mitigation

### Technical Risks
1. **False positives**: Tune alert thresholds gradually
2. **Tool compatibility**: Test across build environments
3. **Performance overhead**: Monitor monitoring system impact

### Process Risks
1. **Alert fatigue**: Implement intelligent alerting
2. **Team adoption**: Provide training and documentation
3. **Maintenance burden**: Automate wherever possible

## Appendix: Measurement Tools

### CLI Tools for Local Testing
```bash
# Bundle analysis
npx webpack-bundle-analyzer dist/stats.json

# CSS statistics
npx cssstats dist/*.css

# Performance testing
npx lighthouse http://localhost:3000 --view

# Unused CSS detection
npx purgecss --css dist/*.css --content dist/*.html --output dist/optimized/
```

### Browser DevTools Features
- **Coverage tab**: Identify unused CSS
- **Performance panel**: Analyze rendering performance
- **Layers panel**: Inspect compositing layers
- **Rendering tab**: Debug layout thrashing

This monitoring plan provides comprehensive coverage of CSS performance metrics with automated alerts, continuous integration checks, and real user monitoring to ensure the optimization efforts deliver measurable improvements.