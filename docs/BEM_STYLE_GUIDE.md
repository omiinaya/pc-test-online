# BEM (Block Element Modifier) CSS Naming Convention Guide

## Overview

This guide establishes the BEM (Block Element Modifier) methodology as the standard CSS naming convention for the MMIT Lab project. BEM provides a structured, maintainable approach to CSS that eliminates specificity conflicts and improves code clarity.

## BEM Structure

### Basic Syntax
```
.block {}
.block__element {}
.block--modifier {}
```

### Components Breakdown

#### Block
- Standalone entity that is meaningful on its own
- Examples: `header`, `menu`, `button`, `test-panel`

#### Element
- Part of a block that has no standalone meaning
- Syntax: `block__element`
- Examples: `header__logo`, `menu__item`, `button__icon`

#### Modifier
- Flag on a block or element to change appearance or behavior
- Syntax: `block--modifier` or `block__element--modifier`
- Examples: `button--primary`, `menu__item--active`

## Implementation Rules

### 1. Naming Conventions
- **Use lowercase letters**: `test-panel` not `TestPanel`
- **Separate words with single hyphen**: `visualizer-container`
- **Elements use double underscore**: `test-panel__header`
- **Modifiers use double hyphen**: `button--primary`

### 2. Specificity Management
```css
/* ❌ Avoid high specificity */
.test-panel .header .title { }

/* ✅ Use BEM specificity */
.test-panel__header__title { }
```

### 3. File Organization
```
frontend/src/styles/
├── components/          # Block-specific styles
│   ├── TestPanel.css
│   ├── Button.css
│   └── Visualizer.css
├── utilities/          # Utility classes
└── variables.css       # Design tokens
```

## Migration Examples

### Before (Current Pattern)
```css
/* Inconsistent naming */
.testPanelWrapper { }
.test-name { }
.actionButton { }

/* High specificity conflicts */
.test-nav li .test-name { color: #ffffff !important; }

/* Duplicate definitions */
.action-button { /* buttons.css */ }
.action-button { /* WebVitalsPage.vue */ }
```

### After (BEM Standard)
```css
/* Consistent block naming */
.test-panel__wrapper { }
.test-panel__name { }
.action-button { } /* Now a block */

/* Proper specificity */
.test-nav__item__name { color: var(--text-primary); }

/* Single source of truth */
.action-button { /* Only in Button.css */ }
.action-button--primary { /* Modifier class */ }
```

## Component Refactoring Guide

### 1. VisualizerContainer Component
**Current**: [`VisualizerContainer.vue`](frontend/src/components/VisualizerContainer.vue:89)
```css
.visualizer-container { }
.visualizer-container.full-width { }
.visualizer-container.flex-centered { }
```

**BEM Refactored**:
```css
.visualizer { }
.visualizer--full-width { }
.visualizer--flex-centered { }
.visualizer__content { }
```

### 2. Button System
**Current**: Multiple definitions across files
```css
/* buttons.css */
.action-button { }
.action-button.success { }
.action-button.primary { }

/* Component overrides */
.action-button { min-width: 140px; }
```

**BEM Refactored**:
```css
/* Button.css - Single source */
.button { }
.button--primary { }
.button--success { }
.button--danger { }
.button--small { }
.button--large { }
```

### 3. Test Navigation
**Current**: [`App.vue`](frontend/src/App.vue:1792)
```css
.test-nav li .test-name { color: #ffffff !important; }
.test-nav li.disabled .test-name { }
```

**BEM Refactored**:
```css
.test-nav__item { }
.test-nav__item--disabled { }
.test-nav__name { color: var(--text-primary); }
```

## Best Practices

### 1. Avoid Nesting in CSS
```css
/* ❌ Avoid */
.test-panel {
  .header {
    .title { }
  }
}

/* ✅ Prefer */
.test-panel__header { }
.test-panel__header__title { }
```

### 2. Use CSS Custom Properties
```css
/* Design tokens in variables.css */
:root {
  --text-primary: #ffffff;
  --spacing-lg: 1.5rem;
}

/* Component usage */
.test-panel__name {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}
```

### 3. Modifier Classes for States
```css
/* State management */
.button { /* base styles */ }
.button--disabled { opacity: 0.6; }
.button--loading { pointer-events: none; }

/* JavaScript interaction */
element.classList.add('button--disabled');
element.classList.remove('button--disabled');
```

### 4. Responsive Design Patterns
```css
/* Mobile-first approach */
.test-panel {
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .test-panel {
    padding: var(--spacing-lg);
  }
  
  .test-panel--wide {
    max-width: 800px;
  }
}
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. **Documentation**: This style guide
2. **Training**: Team BEM methodology session
3. **Linting**: ESLint rules for BEM compliance

### Phase 2: Component Migration (Week 2-3)
1. **High-impact components**: Buttons, navigation, containers
2. **Priority order**: Most duplicated → least duplicated
3. **Testing**: Visual regression for each component

### Phase 3: Full Adoption (Week 4+)
1. **Complete migration**: All components to BEM
2. **Performance audit**: CSS bundle size analysis
3. **Maintenance**: Ongoing code reviews

## Tools and Automation

### ESLint Rules
```json
{
  "rules": {
    "bem/no-hyphenated-classnames": "error",
    "bem/no-camelcase-classnames": "error",
    "bem/valid-block-name": "error"
  }
}
```

### CSS Organization
```
frontend/src/styles/
├── components/          # BEM blocks
│   ├── Button/
│   │   ├── Button.css
│   │   ├── Button.vue
│   │   └── Button.test.js
│   └── TestPanel/
├── utilities/          # Utility classes
│   ├── spacing.css
│   ├── typography.css
│   └── layout.css
├── variables.css       # Design tokens
└── index.css          # Main import file
```

## Common Pitfalls and Solutions

### Pitfall 1: Overly Long Class Names
```css
/* ❌ Too specific */
.user-profile-settings-section__form-field__label-text { }

/* ✅ Better abstraction */
.settings-form__label { }
```

### Pitfall 2: Modifier Abuse
```css
/* ❌ Too many modifiers */
.button--primary--large--disabled--loading { }

/* ✅ Separate concerns */
.button--primary.button--large.button--disabled.button--loading { }
```

### Pitfall 3: Global Namespace Pollution
```css
/* ❌ Global scope */
.header { } /* Might conflict */

/* ✅ Scoped with block */
.app-header { }
.test-header { }
```

## Performance Considerations

### 1. CSS Specificity
- BEM naturally keeps specificity low (single class)
- Eliminates need for `!important` declarations
- Reduces selector matching time

### 2. Bundle Size
- Consistent naming reduces duplication
- Clear structure enables better dead code elimination
- Modular organization supports code splitting

### 3. Maintenance Cost
- Predictable naming reduces cognitive load
- Clear patterns enable faster onboarding
- Automated linting catches violations early

## Review and Approval

This style guide should be reviewed by:
- [ ] Frontend Development Team
- [ ] UX/Design Team  
- [ ] Quality Assurance Team
- [ ] Project Lead

**Effective Date**: 2025-09-02  
**Review Schedule**: Quarterly reviews with the architecture team

## Appendix: Reference Materials

### BEM Resources
- [Official BEM Methodology](https://en.bem.info/methodology/)
- [CSS Tricks BEM Guide](https://css-tricks.com/bem-101/)
- [Google BEM Introduction](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/css#BEM)

### Tooling
- [stylelint-bem](https://github.com/postcss/postcss-bem-linter)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [PostCSS](https://postcss.org/)

### Performance Monitoring
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)