# MMIT QA Tools - Normalized Architecture Guide

## 🏗️ **Architecture Overview**

The MMIT QA Tools frontend has been completely normalized using a composable-based architecture that
eliminates code duplication and provides consistent patterns across all device test components.

---

## 📋 **Quick Start Guide**

### **Creating a New Device Test Component**

```vue
<template>
  <div class="test-container">
    <!-- State Panels (automatic based on composable state) -->
    <StatePanel
      v-if="isLoading"
      state="loading"
      title="Detecting devices..."
      message="Please wait while we search for available devices"
    />

    <StatePanel
      v-else-if="needsPermission"
      state="info"
      title="Permission Required"
      message="Please allow access to test your device."
      :showActionButton="true"
      actionLabel="Grant Access"
      @action-clicked="requestPermission"
    />

    <StatePanel
      v-else-if="hasError"
      state="error"
      title="Device Error"
      :message="currentError"
      :showRetryButton="true"
      @retry="resetTest"
    />

    <!-- Main Test Content -->
    <template v-else-if="showTestContent">
      <DeviceSelector
        v-if="availableDevices.length > 1"
        :devices="availableDevices"
        :selectedDeviceId="selectedDeviceId"
        label="Device"
        deviceType="Device"
        @device-changed="switchDevice"
      />

      <!-- Your test-specific content here -->
      <div class="test-area">
        <!-- Test implementation -->
      </div>

      <!-- Action buttons for manual completion -->
      <TestActionButtons
        @test-complete="completeTest"
        @test-skip="skipTest"
        @test-retry="resetTest"
      />
    </template>
  </div>
</template>

<script>
import StatePanel from './StatePanel.vue';
import DeviceSelector from './DeviceSelector.vue';
import TestActionButtons from './TestActionButtons.vue';
import { useEnhancedDeviceTest } from '../composables/useEnhancedDeviceTest.js';

export default {
  name: 'YourTest',
  components: {
    StatePanel,
    DeviceSelector,
    TestActionButtons,
  },
  emits: ['test-completed', 'test-failed', 'test-skipped', 'start-over'],

  setup(props, { emit }) {
    // Single import provides complete test functionality
    const deviceTest = useEnhancedDeviceTest(
      {
        deviceKind: 'videoinput', // 'videoinput', 'audioinput', 'audiooutput'
        deviceType: 'Camera', // Display name for UI
        permissionType: 'camera', // Permission type or null for no permissions
        testName: 'your-test', // Unique test identifier
        autoInitialize: true, // Auto-initialize on mount
        enableEventListeners: true, // Enable event management
        enableAnimations: true, // Enable animation patterns
        enableLifecycle: true, // Enable lifecycle management
      },
      emit
    );

    // Test-specific logic here
    const runTestSpecificAction = () => {
      // Your implementation
      deviceTest.completeTest({ additionalData: 'test complete' });
    };

    return {
      ...deviceTest,
      runTestSpecificAction,
    };
  },
};
</script>
```

---

## 🧩 **Core Composables**

### **1. useEnhancedDeviceTest (Master Composable)**

**Purpose:** Single import for complete device test setup

**Usage:**

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

**Provides:**

- Device enumeration and selection
- Permission management
- Media stream handling
- Error handling and state management
- Test result tracking
- Event listener management
- Lifecycle management
- Animation support

### **2. useTestResults (Test Completion)**

**Purpose:** Standardized test completion, failure, and skip handling

**Usage:**

```javascript
const testResults = useTestResults('test-name', emit);

// Complete test
testResults.completeTest({ score: 100 });

// Fail test
testResults.failTest('Error message', { details: 'more info' });

// Skip test
testResults.skipTest('User skipped', { reason: 'user choice' });

// Reset test
testResults.resetTest();
```

### **3. useEventListeners (Event Management)**

**Purpose:** Centralized event listener management with automatic cleanup

**Usage:**

```javascript
const eventListeners = useEventListeners();

// Add listeners (automatically cleaned up on unmount)
eventListeners.addEventListener(window, 'keydown', handleKeyDown);
eventListeners.addEventListener(document, 'click', handleClick);

// Manual cleanup if needed
eventListeners.removeEventListener(window, 'keydown');
```

### **4. useComponentLifecycle (Lifecycle Management)**

**Purpose:** Standardized component initialization and cleanup

**Usage:**

```javascript
const lifecycle = useComponentLifecycle();

lifecycle.onInitialize(async () => {
  // Initialization logic
});

lifecycle.onCleanup(() => {
  // Cleanup logic
});

lifecycle.onActivate(() => {
  // Keep-alive activate
});

lifecycle.onDeactivate(() => {
  // Keep-alive deactivate
});
```

### **5. useAnimations (Animation Patterns)**

**Purpose:** Reusable animation patterns with automatic cleanup

**Usage:**

```javascript
const animations = useAnimations();

// Animate a value over time
animations.animateValue({
  from: 0,
  to: 100,
  duration: 1000,
  onUpdate: value => {
    element.style.width = value + '%';
  },
});

// Request animation frame
const cancelAnimation = animations.requestAnimationFrame(() => {
  // Animation logic
});
```

---

## 🔧 **Specialized Composables**

### **Device Management**

```javascript
// Device enumeration with caching
const deviceEnum = useDeviceEnumeration('videoinput', 'Camera');

// Media permissions
const permissions = useMediaPermissions('camera-test', 'camera');

// Media stream management
const mediaStream = useMediaStream();
```

### **State Management**

```javascript
// Global test state
const testState = useTestState('test-type');

// Global reset functionality
const globalReset = useGlobalReset(() => {
  // Reset callback
});

// Reset all tests
resetAllTestStates();
```

### **Utility Composables**

```javascript
// Error handling
const errorHandling = useErrorHandling();

// Canvas management
const canvas = useCanvas(canvasRef);

// Timer management
const timers = useTestTimers();
```

---

## 📝 **Component Patterns**

### **State Panel Integration**

All components use standardized state panels:

```javascript
// Automatic state panel configuration
const statePanelConfig = computed(() => {
  if (hasError.value) return errorConfig;
  if (isLoading.value) return loadingConfig;
  if (needsPermission.value) return permissionConfig;
  return null;
});

// Show test content when ready
const showTestContent = computed(
  () => !hasError.value && !isLoading.value && hasPermission.value && hasDevices.value
);
```

### **Device Selection Pattern**

```vue
<DeviceSelector
  v-if="availableDevices.length > 1"
  :devices="availableDevices"
  :selectedDeviceId="selectedDeviceId"
  label="Device Type"
  deviceType="Device"
  @device-changed="switchDevice"
/>
```

### **Test Completion Pattern**

```javascript
// Manual completion (recommended)
const handleTestSuccess = () => {
  completeTest({
    score: calculateScore(),
    timestamp: Date.now(),
  });
};

// Error handling
const handleTestError = error => {
  failTest(error.message, {
    errorCode: error.code,
    stack: error.stack,
  });
};
```

---

## 🎯 **Best Practices**

### **1. Use the Master Composable**

Always start with `useEnhancedDeviceTest` for device tests:

```javascript
// ✅ Good
const deviceTest = useEnhancedDeviceTest(options, emit)

// ❌ Avoid (unless you need very specific control)
const deviceEnum = useDeviceEnumeration(...)
const permissions = useMediaPermissions(...)
const mediaStream = useMediaStream(...)
```

### **2. Manual Test Completion**

Always require user interaction for test completion:

```javascript
// ✅ Good - Manual completion
<button @click="completeTest">Test Passed</button>

// ❌ Avoid - Auto completion
watch(stream, (newStream) => {
  if (newStream) completeTest() // Don't do this
})
```

### **3. Error Handling**

Use the built-in error handling:

```javascript
// ✅ Good
try {
  await deviceTest.getDeviceStream();
} catch (error) {
  // Error automatically handled by composable
}

// ❌ Avoid
try {
  await getStream();
} catch (error) {
  setError(error.message); // Composable handles this
}
```

### **4. Event Listeners**

Always use the event management composable:

```javascript
// ✅ Good
const eventListeners = useEventListeners();
eventListeners.addEventListener(window, 'keydown', handler);

// ❌ Avoid
window.addEventListener('keydown', handler); // No automatic cleanup
```

---

## 🔄 **Migration Guide**

### **From Old Pattern to New Pattern**

**Old Component Structure:**

```javascript
export default {
  data() {
    return {
      devices: [],
      selectedDevice: null,
      hasPermission: false,
      error: null,
    };
  },
  async mounted() {
    await this.initializeDevices();
    this.setupEventListeners();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    async initializeDevices() {
      /* ... */
    },
    setupEventListeners() {
      /* ... */
    },
    cleanup() {
      /* ... */
    },
  },
};
```

**New Normalized Structure:**

```javascript
export default {
  setup(props, { emit }) {
    return useEnhancedDeviceTest(
      {
        deviceKind: 'videoinput',
        deviceType: 'Camera',
        permissionType: 'camera',
        testName: 'webcam',
      },
      emit
    );
  },
};
```

### **Migration Checklist**

- [ ] Replace device enumeration logic with `useEnhancedDeviceTest`
- [ ] Replace permission handling with composable
- [ ] Replace event listeners with `useEventListeners`
- [ ] Replace lifecycle hooks with `useComponentLifecycle`
- [ ] Replace test completion with `useTestResults`
- [ ] Remove manual cleanup code (automatically handled)
- [ ] Update template to use composable state
- [ ] Test all functionality

---

## 🧪 **Testing the Architecture**

### **Component Testing**

```javascript
// Test composable integration
import { useEnhancedDeviceTest } from '@/composables/useEnhancedDeviceTest';

test('device test initialization', async () => {
  const emit = vi.fn();
  const deviceTest = useEnhancedDeviceTest(
    {
      deviceKind: 'videoinput',
      deviceType: 'Camera',
      testName: 'test',
    },
    emit
  );

  await deviceTest.initializeTest();
  expect(deviceTest.isInitialized.value).toBe(true);
});
```

### **E2E Testing**

```javascript
// Test complete user flow
test('camera test flow', async () => {
  await page.goto('/camera-test');

  // Should request permission
  await page.click('[data-testid="grant-permission"]');

  // Should enumerate devices
  await page.waitFor('[data-testid="device-selector"]');

  // Should show test content
  await page.waitFor('[data-testid="camera-preview"]');

  // Should complete manually
  await page.click('[data-testid="test-complete"]');

  // Should emit completion
  expect(completionEvent).toHaveBeenCalled();
});
```

---

## 📚 **API Reference**

### **useEnhancedDeviceTest Options**

| Option                 | Type    | Default  | Description                               |
| ---------------------- | ------- | -------- | ----------------------------------------- |
| `deviceKind`           | string  | null     | 'videoinput', 'audioinput', 'audiooutput' |
| `deviceType`           | string  | 'device' | Display name for UI                       |
| `permissionType`       | string  | null     | Permission type or null                   |
| `testName`             | string  | 'test'   | Unique test identifier                    |
| `autoInitialize`       | boolean | true     | Auto-initialize on mount                  |
| `enableEventListeners` | boolean | true     | Enable event management                   |
| `enableAnimations`     | boolean | true     | Enable animation patterns                 |
| `enableLifecycle`      | boolean | true     | Enable lifecycle management               |

### **Returned State**

| Property            | Type    | Description                |
| ------------------- | ------- | -------------------------- |
| `isInitialized`     | boolean | Test initialization status |
| `currentState`      | string  | Current test state         |
| `availableDevices`  | array   | Available devices          |
| `selectedDeviceId`  | string  | Selected device ID         |
| `hasDevices`        | boolean | Has available devices      |
| `isLoading`         | boolean | Loading state              |
| `hasPermission`     | boolean | Permission granted         |
| `needsPermission`   | boolean | Permission required        |
| `permissionBlocked` | boolean | Permission denied          |
| `hasActiveStream`   | boolean | Stream active              |
| `hasError`          | boolean | Error state                |
| `currentError`      | string  | Error message              |
| `showTestContent`   | boolean | Should show test UI        |

### **Methods**

| Method                         | Description                |
| ------------------------------ | -------------------------- |
| `initializeTest()`             | Initialize the test        |
| `requestPermission()`          | Request device permission  |
| `getDeviceStream(constraints)` | Get media stream           |
| `switchDevice(deviceId)`       | Switch to different device |
| `completeTest(data)`           | Complete test successfully |
| `failTest(reason, data)`       | Fail test with reason      |
| `skipTest(reason, data)`       | Skip test                  |
| `resetTest()`                  | Reset to initial state     |
| `cleanup()`                    | Manual cleanup             |

---

## 🚀 **Future Development**

### **Adding New Features**

1. **New Test Component**: Use the master composable pattern
2. **New Device Type**: Extend `useEnhancedDeviceTest` options
3. **New Interaction Pattern**: Create specialized composable
4. **New Animation**: Extend `useAnimations` with new patterns

### **Performance Optimization**

- Device enumeration caching is already implemented
- Permission state persistence available
- Keep-alive optimization in place
- Bundle splitting by composable function

### **Maintenance**

- All patterns are centralized in composables
- Updates need to be made in one place
- Consistent APIs across all components
- Automatic cleanup prevents memory leaks

---

This normalized architecture provides a solid foundation for maintainable, performant, and
consistent device testing components while eliminating code duplication and common pitfalls.
