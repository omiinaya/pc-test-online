# Component Persistence and Performance Optimization

## Overview

This document outlines the improvements made to the MMIT testing app to ensure common components are
persistent and prevent unnecessary destruction and recreation.

## Issues Identified

### 1. Conditional Rendering with v-if

**Problem**: All test components were using `v-if` in the main App.vue, causing complete destruction
and recreation when switching between tests.

**Impact**:

- Loss of component state
- Redundant initialization of devices and permissions
- Poor user experience with loading delays
- Unnecessary API calls

### 2. No Component Caching

**Problem**: No keep-alive mechanism was implemented.

**Impact**:

- Components were fully destroyed when not active
- Loss of expensive computations and device access

### 3. Redundant State Management

**Problem**: Each test component managed its own state independently.

**Impact**:

- Repeated device enumeration
- Multiple permission requests
- Inconsistent state between components

## Solutions Implemented

### 1. Keep-Alive Implementation

**File**: `frontend/src/App.vue`

```vue
<!-- Before -->
<WebcamTest v-if="activeTest === 'webcam'" />
<MicrophoneTest v-if="activeTest === 'microphone'" />
<!-- ... other components -->

<!-- After -->
<keep-alive>
  <component
    :is="currentTestComponent"
    :key="activeTest"
    @test-completed="onTestCompleted"
    @test-failed="onTestFailed"
    @test-skipped="onTestSkipped"
    @start-over="resetTests"
  />
</keep-alive>
```

### 2. Shared State Management

**File**: `frontend/src/composables/useTestState.js`

Created a centralized state management system with three main composables:

#### useTestState(testType)

- Manages test lifecycle state
- Prevents redundant initialization
- Tracks active/inactive states

#### useDeviceCache(deviceType)

- Caches device enumeration results
- Prevents redundant API calls
- 30-second cache duration

#### usePermissionState(permissionType)

- Caches permission states
- Prevents redundant permission requests
- 1-minute cache duration

### 3. Enhanced Component Lifecycle

**File**: `frontend/src/components/BaseTest.vue`

Added Vue keep-alive hooks:

```javascript
activated() {
  // Component becomes active - only restart timer if needed
  if (!this.hasStartedTimer || this.status === "pending") {
    this.startTimer();
  }
},
deactivated() {
  // Component becomes inactive - pause but don't destroy
  this.testState.setActive(false);
}
```

### 4. Intelligent Component Initialization

**File**: `frontend/src/components/WebcamTest.vue`

Enhanced initialization logic:

```javascript
async initializeTest() {
  // Check if already initialized and no errors
  if (this.testState.hasBeenInitialized && !this.testState.lastError) {
    console.log('WebcamTest already initialized, skipping re-initialization');
    return;
  }
  // ... rest of initialization
}
```

## Performance Benefits

### 1. Reduced API Calls

- Device enumeration cached for 30 seconds
- Permission states cached for 1 minute
- Prevents redundant getUserMedia calls

### 2. Faster Component Switching

- Components remain in memory when inactive
- State preservation across switches
- Instant activation for previously initialized components

### 3. Better User Experience

- No loading delays when returning to tests
- Preserved device selections
- Maintained permission states

### 4. Memory Efficiency

- Controlled caching with expiration
- Proper cleanup in beforeUnmount
- Selective reinitialization only when needed

## Implementation Guidelines

### For New Test Components

1. **Use the shared composables**:

```javascript
import { useTestState, useDeviceCache, usePermissionState } from "../composables/useTestState.js";

setup() {
  const testState = useTestState('your-test-type');
  const deviceCache = useDeviceCache('your-device-type');
  const permissionState = usePermissionState('your-permission-type');
  return { testState, deviceCache, permissionState };
}
```

2. **Implement keep-alive hooks**:

```javascript
activated() {
  // Check if reinitialization is needed
  if (!this.testState.hasBeenInitialized || this.testState.lastError) {
    this.initializeTest();
  }
},
deactivated() {
  // Pause but don't destroy expensive resources
  this.pauseTest();
}
```

3. **Use intelligent initialization**:

```javascript
async initializeTest() {
  if (this.testState.hasBeenInitialized && !this.testState.lastError) {
    return; // Skip reinitialization
  }
  // ... initialization logic
  this.testState.setInitialized(true);
}
```

### Cache Management

- **Device caches**: 30-second expiration
- **Permission caches**: 1-minute expiration
- **Manual cache clearing**: Available through `resetAllTestStates()`

## Testing the Improvements

### Before Optimization

1. Switch between test components
2. Notice loading delays each time
3. Check browser DevTools Network tab for repeated API calls

### After Optimization

1. Switch between test components
2. Notice instant switching after first initialization
3. Verify reduced API calls in Network tab
4. Confirm state preservation (device selections, etc.)

## Future Enhancements

1. **Persistent Storage**: Save device preferences in localStorage
2. **Background Preloading**: Initialize components in background
3. **Smarter Cache Invalidation**: Detect device changes automatically
4. **Component Prioritization**: Keep frequently used components active longer

## Files Modified

- `frontend/src/App.vue` - Keep-alive implementation
- `frontend/src/components/BaseTest.vue` - Lifecycle hooks
- `frontend/src/components/WebcamTest.vue` - Example shared state usage
- `frontend/src/composables/useTestState.js` - New shared state management

The improvements significantly enhance the app's performance and user experience while maintaining
clean, maintainable code architecture.
