# Component Structure Analysis & Optimization Plan

## Current Component Architecture

### 1. Base Components

- **BaseTest.vue** - Common wrapper for all test components (✅ **ENHANCED** - Added
  showActionButtons prop)
- **TestActionButtons.vue** - Standard pass/fail/skip buttons
- **TestSpinner.vue** - Loading indicator with customizable message
- **TestsCompleted.vue** - Final completion screen (✅ **REFACTORED**)

### 2. Test Components

- **BatteryTest.vue** - Battery status and charging test (✅ **REFACTORED**)
- **KeyboardTest.vue** - Keyboard input testing with visual layout (✅ **REFACTORED**)
- **MicrophoneTest.vue** - Microphone permission and audio input testing (✅ **REFACTORED**)
- **MouseTest.vue** - Mouse button and scroll testing with visual feedback (✅ **REFACTORED**)
- **SpeakerTest.vue** - Speaker output testing with channel selection (✅ **REFACTORED**)
- **TouchTest.vue** - Touch/drag interaction testing (✅ **REFACTORED**)
- **WebcamTest.vue** - Camera permission and video feed testing (✅ **REFACTORED**)

## Identified Patterns & Redundancies

### 1. **Permission Handling Pattern** (HIGH REDUNDANCY)

**Found in:** MicrophoneTest.vue, WebcamTest.vue

**Redundant Code:**

```vue
<!-- Permission Request State -->
<div v-else-if="!permissionGranted && !permissionDenied" class="state-panel">
  <div class="panel-icon">
    <svg><!-- Lock icon --></svg>
  </div>
  <h3>[Device] Permission Required</h3>
  <p>Please allow [device] access to test your [device].</p>
  <button @click="requestPermission" class="action-button primary">
    Grant [Device] Access
  </button>
</div>

<!-- Permission Denied State -->
<div v-else-if="permissionDenied" class="state-panel">
  <div class="panel-icon error-icon">
    <svg><!-- X-circle icon --></svg>
  </div>
  <h3>[Device] Access Denied</h3>
  <p>Please enable [device] permissions in your browser settings and try again.</p>
  <button @click="requestPermission" class="action-button primary">
    Try Again
  </button>
</div>
```

### 2. **Device Detection Pattern** (HIGH REDUNDANCY)

**Found in:** MicrophoneTest.vue, SpeakerTest.vue, WebcamTest.vue

**Redundant Code:**

```vue
<!-- Loading devices -->
<div v-if="loadingDevices" class="state-panel loading-devices">
  <TestSpinner :message="[deviceType]DetectMessage" color="#ff6b00" :showIcon="true" />
</div>

<!-- No devices found -->
<div v-if="available[Devices].length === 0" class="state-panel no-[devices]">
  <div class="panel-icon error-icon">
    <svg><!-- Alert triangle --></svg>
  </div>
  <h3>No [Devices] Found</h3>
  <p>No [devices] were found on your system.</p>
</div>
```

### 3. **Error State Pattern** (MEDIUM REDUNDANCY)

**Found in:** MicrophoneTest.vue, WebcamTest.vue, BatteryTest.vue

**Redundant Code:**

```vue
<div v-if="loading || error" class="state-panel">
  <div v-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Initializing [device]...</p>
  </div>
  <div v-if="error" class="error-state">
    <div class="panel-icon error-icon">
      <svg><!-- Alert triangle --></svg>
    </div>
    <h3>[Device] Error</h3>
    <p>{{ error }}</p>
    <button @click="retryTest" class="action-button primary">Retry Test</button>
  </div>
</div>
```

### 4. **Test Header Pattern** (HIGH REDUNDANCY)

**Found in:** All test components

**Redundant Code:**

```vue
<div class="test-header" style="text-align: center;">
  <h2 class="test-title-centered">
    <span class="test-header-icon">
      <svg><!-- Device-specific icon --></svg>
    </span>
    [Device] Test
  </h2>
  <p class="test-description">[Device-specific description]</p>
</div>
```

### 5. **Visual Container Pattern** (MEDIUM REDUNDANCY)

**Found in:** All test components

**Redundant Code:**

```vue
<div class="visualizer-container">
  <!-- Device-specific content -->
</div>
```

### 6. **Action Button Styling** (HIGH REDUNDANCY)

**Found in:** Multiple components with slight variations

**Redundant CSS:**

```css
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  color: white;
}

.action-button.primary {
  background-color: #ff6b00;
}
.action-button.success {
  background-color: #28a745;
}
.action-button.danger {
  background-color: #dc3545;
}
```

### 7. **State Panel Pattern** (HIGH REDUNDANCY)

**Found in:** All components with state management

**Redundant CSS:**

```css
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: #fff;
  flex-grow: 1;
}

.panel-icon {
  margin-bottom: 1rem;
  color: #ff6b00;
}

.panel-icon.error-icon {
  color: #dc3545;
}
```

## Optimization Strategy

### Phase 1: Create Reusable Components

#### 1.1 **DevicePermissionHandler.vue**

**Purpose:** Handle permission requests for media devices **Props:**

- `deviceType` (string): 'camera', 'microphone', etc.
- `permissionState` (object): { granted, denied, checking }
- `customIcon` (component): Optional custom icon

**Emits:**

- `request-permission`
- `permission-granted`
- `permission-denied`

#### 1.2 **DeviceDetector.vue**

**Purpose:** Handle device detection and loading states **Props:**

- `deviceType` (string): 'cameras', 'microphones', 'speakers'
- `devices` (array): List of available devices
- `isLoading` (boolean): Loading state
- `loadingMessage` (string): Custom loading message

**Emits:**

- `device-selected`
- `retry-detection`

#### 1.3 **TestHeader.vue**

**Purpose:** Standardized test header with icon and description **Props:**

- `testTitle` (string): Test name
- `testDescription` (string): Test description
- `icon` (component): SVG icon component
- `centerAlign` (boolean): Whether to center align

#### 1.4 **StatePanel.vue**

**Purpose:** Standardized state display (error, loading, success) **Props:**

- `state` (string): 'loading', 'error', 'success', 'info'
- `title` (string): Panel title
- `message` (string): Panel message
- `icon` (component): Custom icon
- `showRetryButton` (boolean): Show retry button
- `retryLabel` (string): Retry button label

**Emits:**

- `retry`
- `action-clicked`

#### 1.5 **VisualizerContainer.vue**

**Purpose:** Standardized container for test visualizations **Props:**

- `backgroundColor` (string): Background color
- `borderColor` (string): Border color
- `minHeight` (string): Minimum height
- `padding` (string): Container padding

### Phase 2: Extract Common Styles

#### 2.1 **Create Shared CSS Variables**

```css
:root {
  --primary-color: #ff6b00;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --background-dark: #141414;
  --background-medium: #2c2c2e;
  --border-color: #333;
  --text-primary: #fff;
  --text-secondary: #bdbdbd;
  --border-radius: 8px;
  --border-radius-large: 12px;
  --transition-default: all 0.2s ease;
}
```

#### 2.2 **Create Utility Classes**

```css
/* Button utilities */
.btn-primary {
  background-color: var(--primary-color);
}
.btn-success {
  background-color: var(--success-color);
}
.btn-danger {
  background-color: var(--danger-color);
}
.btn-warning {
  background-color: var(--warning-color);
}

/* Layout utilities */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.flex-column {
  flex-direction: column;
}
.text-center {
  text-align: center;
}
.gap-sm {
  gap: 0.5rem;
}
.gap-md {
  gap: 1rem;
}
.gap-lg {
  gap: 1.5rem;
}
```

### Phase 3: Create Composables

#### 3.1 **useDevicePermissions.js**

```javascript
export function useDevicePermissions(deviceType) {
  const permissionState = ref({
    granted: false,
    denied: false,
    checking: false,
  });

  const requestPermission = async () => {
    // Common permission logic
  };

  const checkPermission = async () => {
    // Common permission checking
  };

  return {
    permissionState,
    requestPermission,
    checkPermission,
  };
}
```

#### 3.2 **useDeviceDetection.js**

```javascript
export function useDeviceDetection(deviceType) {
  const devices = ref([]);
  const isLoading = ref(false);
  const selectedDevice = ref(null);

  const detectDevices = async () => {
    // Common device detection logic
  };

  const selectDevice = deviceId => {
    // Common device selection logic
  };

  return {
    devices,
    isLoading,
    selectedDevice,
    detectDevices,
    selectDevice,
  };
}
```

#### 3.3 **useTestState.js**

```javascript
export function useTestState() {
  const currentState = ref('idle');
  const error = ref(null);
  const isLoading = ref(false);

  const setState = state => {
    currentState.value = state;
  };

  const setError = errorMessage => {
    error.value = errorMessage;
    currentState.value = 'error';
  };

  const setLoading = loading => {
    isLoading.value = loading;
    currentState.value = loading ? 'loading' : 'idle';
  };

  return {
    currentState,
    error,
    isLoading,
    setState,
    setError,
    setLoading,
  };
}
```

## Implementation Plan

### Phase 1: Foundation (Week 1)

1. Create shared CSS variables and utility classes
2. Create `StatePanel.vue` component
3. Create `TestHeader.vue` component
4. Create `VisualizerContainer.vue` component

### Phase 2: Device Components (Week 2)

1. Create `DevicePermissionHandler.vue`
2. Create `DeviceDetector.vue`
3. Create composables for permissions and device detection
4. Create `useTestState.js` composable

### Phase 3: Component Refactoring (Week 3)

1. Refactor `WebcamTest.vue` to use new components
2. Refactor `MicrophoneTest.vue` to use new components
3. Refactor `SpeakerTest.vue` to use new components
4. Test all functionality thoroughly

### Phase 4: Final Optimization (Week 4)

1. Refactor remaining components
2. Remove duplicate CSS
3. Optimize bundle size
4. Performance testing and documentation

## Expected Benefits

### Code Reduction

- **Estimated 40-50% reduction** in component file sizes
- **Estimated 60-70% reduction** in duplicate CSS
- **Estimated 30-40% reduction** in bundle size

### Maintainability

- **Centralized state management** for common patterns
- **Consistent UI/UX** across all test components
- **Single source of truth** for styling and behavior

### Development Speed

- **Faster development** of new test components
- **Easier debugging** with centralized logic
- **Better testing** with isolated, reusable components

### Performance

- **Reduced bundle size** from eliminated duplicates
- **Better tree-shaking** with composables
- **Improved runtime performance** with optimized components

## Risk Assessment

### Low Risk

- CSS consolidation and utility classes
- Creating new reusable components
- Composable creation

### Medium Risk

- Refactoring existing components
- Changing component interfaces
- Testing all device interactions

### High Risk

- Breaking existing functionality
- Device-specific edge cases
- Cross-browser compatibility

## Success Metrics

1. **Code Metrics**
   - Lines of code reduced by 30%+
   - Duplicate code eliminated by 80%+
   - Bundle size reduced by 25%+

2. **Quality Metrics**
   - No regression in functionality
   - Improved test coverage
   - Better TypeScript support

3. **Developer Experience**
   - Faster component creation
   - Consistent APIs
   - Better documentation

This optimization plan maintains all current functionality while significantly improving code
maintainability, reducing redundancy, and creating a more scalable architecture for future test
components.
