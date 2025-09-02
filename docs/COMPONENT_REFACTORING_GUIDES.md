# Component-Specific CSS Refactoring Guides

## Overview

This document provides detailed refactoring instructions for the most problematic CSS components identified in the analysis. Each guide includes current issues, recommended solutions, and step-by-step migration instructions.

## High Priority Components

### 1. VisualizerContainer Component
**File**: [`frontend/src/components/VisualizerContainer.vue`](frontend/src/components/VisualizerContainer.vue:89)

#### Current Issues
- ❌ Multiple `!important` declarations (lines 120-121, 142)
- ❌ Complex transition chains affecting performance
- ❌ Inconsistent responsive behavior

#### Refactoring Plan

**Step 1: Remove !important declarations**
```css
/* Before */
.keyboard-mode {
  padding: 1.5rem !important;
  max-width: 800px !important;
}

/* After */
.visualizer--keyboard-mode {
  padding: var(--spacing-xl);
  max-width: 800px;
}
```

**Step 2: Optimize Transitions**
```css
/* Before - CPU-intensive */
transition: min-height, max-width, padding, height, box-shadow;

/* After - GPU-accelerated */
transform: translateZ(0);
will-change: transform, opacity;
transition: transform var(--animation-normal), opacity var(--animation-normal);
```

**Step 3: BEM Migration**
```css
/* Block definition */
.visualizer {
  /* base styles */
}

/* Elements */
.visualizer__content { }
.visualizer__header { }

/* Modifiers */
.visualizer--keyboard-mode { }
.visualizer--full-width { }
.visualizer--flex-centered { }
```

### 2. Button System Consolidation
**Files**: Multiple definitions across [`buttons.css`](frontend/src/styles/buttons.css:2), [`WebVitalsPage.vue`](frontend/src/views/WebVitalsPage.vue:578), etc.

#### Current Issues
- ❌ Duplicate `.action-button` definitions
- ❌ Inconsistent styling across components
- ❌ `!important` in success variant (line 35)

#### Refactoring Plan

**Step 1: Create Unified Button System**
```css
/* frontend/src/styles/components/Button.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: var(--transition-default);
  border: none;
  text-decoration: none;
}

/* Variants */
.button--primary {
  background-color: var(--primary-color);
  color: var(--text-primary);
}

.button--success {
  background-color: var(--success-color);
  color: var(--text-primary);
  border: 2px solid var(--success-border-color);
}

.button--danger {
  background-color: var(--danger-color);
  color: var(--text-primary);
}

/* Sizes */
.button--small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.button--large {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
}
```

**Step 2: Remove Component Overrides**
Delete all component-specific `.action-button` definitions and use the unified system.

### 3. Test Navigation System
**Files**: [`App.vue`](frontend/src/App.vue:1792), [`TestsPage.vue`](frontend/src/views/TestsPage.vue:1425)

#### Current Issues
- ❌ Multiple `!important` declarations for text color
- ❌ High specificity nested selectors
- ❌ Inconsistent disabled state handling

#### Refactoring Plan

**Step 1: BEM Structure**
```css
/* Block: test-navigation */
.test-navigation { }

/* Elements */
.test-navigation__list { }
.test-navigation__item { }
.test-navigation__link { }
.test-navigation__name { }

/* Modifiers */
.test-navigation__item--disabled { }
.test-navigation__item--active { }
```

**Step 2: Remove !important**
```css
/* Before */
.test-nav li .test-name {
  color: #ffffff !important;
}

/* After */
.test-navigation__name {
  color: var(--text-primary);
}
```

**Step 3: State Management**
```css
.test-navigation__item--disabled .test-navigation__name {
  opacity: 0.6;
}

.test-navigation__item--active .test-navigation__name {
  font-weight: var(--font-weight-bold);
}
```

### 4. KeyboardTest Component
**File**: [`frontend/src/components/KeyboardTest.vue`](frontend/src/components/KeyboardTest.vue:597)

#### Current Issues
- ❌ Multiple `!important` declarations for blank keys
- ❌ Complex key styling with performance implications
- ❌ Inconsistent button styling

#### Refactoring Plan

**Step 1: Blank Key Optimization**
```css
/* Before - 8 !important declarations */
.key-blank-f {
  background-color: transparent !important;
  border-color: transparent !important;
  /* ... */
}

/* After - Single utility class */
.key--blank {
  visibility: hidden;
  pointer-events: none;
}
```

**Step 2: Keyboard Layout System**
```css
/* Keyboard block */
.keyboard { }

/* Key elements */
.keyboard__row { }
.keyboard__key { }

/* Key modifiers */
.keyboard__key--blank { }
.keyboard__key--special { }
.keyboard__key--wide { }
```

### 5. Animation Performance Optimization
**Files**: Multiple components with complex transitions

#### Current Issues
- ❌ Multiple properties transitioning simultaneously
- ❌ Non-GPU accelerated properties
- ❌ No `will-change` optimization

#### Refactoring Plan

**Step 1: GPU Acceleration**
```css
/* Before - CPU properties */
transition: width, height, padding, margin, box-shadow;

/* After - GPU properties */
transform: translateZ(0);
will-change: transform, opacity;
transition: transform var(--animation-normal), opacity var(--animation-normal);
```

**Step 2: Property Grouping**
```css
/* Group similar properties */
transition: 
  transform var(--animation-normal),
  opacity var(--animation-normal),
  box-shadow var(--animation-slow);
```

## Medium Priority Components

### 6. MicrophoneTest Component
**File**: [`frontend/src/components/MicrophoneTest.vue`](frontend/src/components/MicrophoneTest.vue:464)

**Issues**: Button min-width override

**Solution**: Use size modifier instead of override
```css
/* Before - override */
.action-button {
  min-width: 140px;
}

/* After - use modifier */
<button class="button button--fixed-width">
```

### 7. StatePanel Component  
**File**: [`frontend/src/components/StatePanel.vue`](frontend/src/components/StatePanel.vue:340)

**Issues**: Component-specific button override

**Solution**: Extend button system with modifiers
```css
/* Add to Button.css */
.button--fixed-width {
  min-width: 140px;
}
```

## Implementation Strategy

### Phase 1: High Impact (Week 1)
1. **VisualizerContainer** - Transition optimization
2. **Button System** - Consolidation
3. **Test Navigation** - Specificity reduction

### Phase 2: Medium Impact (Week 2)  
4. **KeyboardTest** - Blank key optimization
5. **Animation System** - GPU acceleration
6. **Component Overrides** - Removal

### Phase 3: Cleanup (Week 3)
7. **CSS Variables** - Audit and consolidation
8. **Responsive Design** - Standardization
9. **Documentation** - Completion

## Testing Strategy

### Visual Regression Tests
```javascript
// tests/visual-regression.test.js
describe('Visual Regression', () => {
  test('VisualizerContainer renders correctly', async () => {
    await page.goto('http://localhost:3000');
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

### Performance Tests
```javascript
// tests/performance.test.js
describe('Animation Performance', () => {
  test('transitions maintain 60fps', async () => {
    const fps = await measureAnimationFPS('.visualizer');
    expect(fps).toBeGreaterThanOrEqual(55);
  });
});
```

## Migration Checklist

### VisualizerContainer
- [ ] Remove !important declarations
- [ ] Optimize transition properties  
- [ ] Implement BEM naming
- [ ] Add GPU acceleration
- [ ] Test responsive behavior

### Button System
- [ ] Create unified Button.css
- [ ] Remove component overrides
- [ ] Update all button references
- [ ] Test all button states

### Test Navigation
- [ ] Reduce specificity
- [ ] Implement BEM structure
- [ ] Remove !important
- [ ] Test disabled states

### KeyboardTest
- [ ] Optimize blank keys
- [ ] Remove !important
- [ ] Implement keyboard BEM
- [ ] Test key interactions

## Risk Mitigation

### Breaking Changes
- ✅ Use feature flags for gradual rollout
- ✅ Comprehensive visual regression testing
- ✅ Browser compatibility testing

### Performance Regressions
- ✅ Baseline performance measurements
- ✅ Continuous performance monitoring
- ✅ A/B testing for critical changes

### Developer Experience
- ✅ Clear documentation and examples
- ✅ Training sessions for new conventions
- ✅ Linting rules to enforce standards

## Success Metrics

### Component-Specific Goals
| Component | Metric | Target |
|-----------|--------|--------|
| VisualizerContainer | !important count | 0 |
| Button System | Duplicate definitions | 0 |
| Test Navigation | Specificity score | ≤ 10 |
| KeyboardTest | Animation FPS | ≥ 60 |
| All Components | BEM compliance | 100% |

### Performance Goals
- ✅ CSS bundle size reduction: 20%
- ✅ Animation performance: 60fps consistently
- ✅ Render time improvement: 15% faster
- ✅ Layout stability: CLS < 0.1

This refactoring guide provides concrete, actionable steps for addressing the most critical CSS issues while maintaining focus on long-term maintainability and performance.