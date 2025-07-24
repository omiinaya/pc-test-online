# Container Morphing Analysis & Solution

## Problem Statement

We want smooth container growing/shrinking animations when switching between tests, but currently
tests "snap" to their new size instantly without any transition.

## Root Cause Analysis

### ❌ **Current Broken Architecture:**

```
App.vue
└── <keep-alive>
    └── <component :is="currentTestComponent">  // Different component each time
        ├── TestHeader (outside container)
        ├── VisualizerContainer (UNIQUE to each component)
        │   └── Test-specific content
        └── ActionButtons (outside container)
```

### 🔍 **Key Issues Identified:**

1. **Multiple Container Instances**: Each test component has its own `VisualizerContainer` instance
2. **Component Switching**: When switching tests, we're switching between entirely different DOM
   elements
3. **No Persistent Container**: There's no single container that persists across test switches
4. **Keep-alive Limitation**: Even with keep-alive, each component's container is separate

### 🧪 **Why Transitions Don't Work:**

- Component A has VisualizerContainer with minHeight: 250px
- Component B has VisualizerContainer with minHeight: 550px
- When switching: Component A disappears, Component B appears
- No transition occurs because they're different DOM elements

## Solution Architecture

### ✅ **Target Architecture:**

```
App.vue
├── TestHeader (dynamic, outside container)
├── VisualizerContainer (SINGLE, PERSISTENT)
│   └── <keep-alive>
│       └── <component :is="currentTestComponent">  // Content only
│           └── Test-specific content (no container)
└── ActionButtons (dynamic, outside container)
```

### 🎯 **Key Principles:**

1. **Single Persistent Container**: One VisualizerContainer that never gets destroyed
2. **Dynamic Container Styles**: Container styles change based on active test
3. **Content-Only Components**: Test components only contain their content, no containers
4. **Persistent Elements**: Header and buttons exist outside the container

## Implementation Plan

### Phase 1: Restructure App.vue

- Move VisualizerContainer to App.vue as a single persistent element
- Add reactive container styles based on active test
- Wrap only the dynamic component content inside the container

### Phase 2: Strip Test Components

- Remove VisualizerContainer from ALL test components
- Remove VisualizerContainer imports and component registrations
- Ensure test components only contain their actual content

### Phase 3: Dynamic Styling System

- Create computed property for container styles based on active test
- Define height mappings for each test type
- Ensure proper CSS transitions on the persistent container

### Phase 4: Header and Button Management

- Move TestHeader outside the container in App.vue
- Make TestHeader dynamic based on active test
- Ensure ActionButtons remain outside container

## Detailed Implementation

### 1. App.vue Structure:

```vue
<template>
  <div class="app-layout">
    <!-- Sidebars remain the same -->

    <main class="main-content">
      <!-- Dynamic header outside container -->
      <component :is="currentTestHeaderComponent" v-bind="currentTestHeaderProps" />

      <!-- Single persistent container -->
      <VisualizerContainer :custom-styles="currentContainerStyles" :key="containerKey">
        <keep-alive>
          <component
            :is="currentTestComponent"
            @test-completed="onTestCompleted"
            @test-failed="onTestFailed"
            @test-skipped="onTestSkipped"
            @start-over="resetTests"
          />
        </keep-alive>
      </VisualizerContainer>

      <!-- Dynamic action buttons outside container -->
      <TestActionButtons
        :actionsDisabled="currentActionsDisabled"
        @not-working="handleFail"
        @working="handlePass"
        @skip="handleSkip"
      />
    </main>
  </div>
</template>
```

### 2. Container Styles Mapping:

```javascript
computed: {
  currentContainerStyles() {
    const styleMap = {
      webcam: { minHeight: '500px' },
      microphone: { minHeight: '350px' },
      speakers: { minHeight: '380px' },
      keyboard: { minHeight: '320px' },
      mouse: { minHeight: '550px' },
      touch: { minHeight: '250px' },
      battery: { minHeight: '280px' },
      testsCompleted: { minHeight: '300px' }
    };
    return styleMap[this.activeTest] || { minHeight: '300px' };
  }
}
```

### 3. Enhanced VisualizerContainer CSS:

```css
.visualizer-container {
  /* Dramatic transitions */
  transition:
    min-height 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    max-width 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    padding 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 600ms ease-out;
}
```

### 4. Stripped Test Components:

```vue
<!-- WebcamTest.vue - Content Only -->
<template>
  <!-- No BaseTest wrapper, no VisualizerContainer -->
  <StatePanel v-if="loading" ... />
  <div class="video-wrapper" v-else>
    <video ref="videoElement" ... />
    <div class="camera-selector">...</div>
  </div>
</template>
```

## Expected Results

### ✅ **Smooth Morphing Behavior:**

1. User clicks "Camera Test" → Container smoothly grows to 500px over 1 second
2. User clicks "Touch Test" → Same container smoothly shrinks to 250px over 1 second
3. User clicks "Mouse Test" → Same container smoothly grows to 550px over 1 second
4. Header content changes instantly but container size transitions smoothly
5. Test content is preserved with keep-alive during transitions

### ✅ **Technical Benefits:**

- Single DOM element for container (persistent across tests)
- Smooth CSS transitions on a stable element
- No component destruction/recreation
- Dramatic size differences (300px range) make morphing very visible
- Clean separation of concerns (content vs. container)

## Migration Steps

### Step 1: Backup Current State

- Create git commit before changes
- Test current functionality

### Step 2: Restructure App.vue

- Add persistent VisualizerContainer
- Add computed properties for dynamic styles
- Extract header and button management

### Step 3: Strip Test Components

- Remove VisualizerContainer from each test component
- Remove BaseTest wrapper if needed
- Test each component individually

### Step 4: Test and Refine

- Verify smooth transitions
- Adjust timing and easing curves
- Ensure all tests work correctly

### Step 5: Polish

- Add visual feedback during transitions
- Optimize performance
- Add error handling

## Success Metrics

- ✅ Container visibly grows/shrinks over 1+ seconds
- ✅ No "snapping" between test sizes
- ✅ All test functionality preserved
- ✅ Smooth, elegant transitions
- ✅ Single persistent container element in DOM
- ✅ 300px+ height differences visible during morphing

This architecture will finally achieve the smooth container morphing effect we want!
