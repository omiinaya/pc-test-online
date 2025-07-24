# GitHub Copilot Instructions for MMIT Testing App

## Project Overview

Vue 3 + Vite device testing app with composable-driven architecture and cross-browser compatibility.

## Core Patterns

### Composables First

- Always use `useEnhancedDeviceTest` for device tests
- Use `showNoDevicesState` instead of `!hasDevices` (2-second delay pattern)
- Follow naming: `use[Feature][Functionality].js`

### Component Structure

```javascript
const deviceTest = useEnhancedDeviceTest(
  {
    deviceKind: 'videoinput',
    deviceType: 'Camera',
    permissionType: 'camera',
    testName: 'webcam',
  },
  emit
);
```

### UI Patterns

- Use `<StatePanel>` for consistent error/loading states
- Manual test completion only via `TestActionButtons`
- Emit: `test-completed`, `test-failed`, `test-skipped`

### Code Standards

- CSS: Use `var(--color-*)` custom properties
- Cleanup: Always use `onUnmounted` for timers
- Error handling: Try-catch with `errorHandling.setError()`
- Accessibility: ARIA labels, high contrast (#000/#fff)

## File Organization

- Components: PascalCase (`WebcamTest.vue`)
- Composables: camelCase (`useDeviceTest.js`)
- CSS classes: kebab-case (`.test-container`)

**Please**: Git add and generate a commit after finishing a task
