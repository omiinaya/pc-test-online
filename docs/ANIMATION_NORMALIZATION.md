# Animation Speed Normalization

## Overview

This document outlines the normalization of animation speeds across the MMIT Testing App using
centralized CSS variables.

## CSS Variables Added/Updated in `variables.css`

### Animation Durations

```css
--animation-instant: 0.05s; /* For immediate feedback (keyboard presses) */
--animation-fast: 0.1s; /* Quick transitions and button presses */
--animation-normal: 0.2s; /* Standard UI transitions */
--animation-slow: 0.3s; /* Deliberate state changes */
--animation-slower: 0.5s; /* Emphasized transitions */
--animation-extra-slow: 0.8s; /* Success animations, checkmarks */
--animation-morphing: 1s; /* Container size changes, spinners */
--animation-celebration: 2s; /* Completion effects, confetti */
```

### Transition Presets

```css
--transition-instant: all var(--animation-instant) ease;
--transition-default: all 0.2s ease;
--transition-fast: all 0.1s ease;
--transition-slow: all 0.3s ease;
--transition-morphing: all var(--animation-morphing) ease-in-out;
--transition-width: width var(--animation-slow) ease;
--transition-transform: transform var(--animation-normal) ease;
--transition-opacity: opacity var(--animation-normal) ease;
```

## Files Updated

### App.vue

- **Sidebar width transitions**: `width 0.3s ease` → `var(--transition-width)`
- **Nav item transitions**: `background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease` →
  Using `var(--animation-normal)`
- **Status indicators**: `background-color 0.3s ease, box-shadow 0.3s ease` → Using
  `var(--animation-slow)`
- **Action buttons**: `all 0.2s ease` → `var(--transition-default)`
- **Dropdown animations**: `0.22s` → `var(--animation-normal)`
- **Export menu**: `background 0.15s, color 0.15s, border-left 0.18s` → Using
  `var(--animation-fast)`
- **Chevron rotations**: `transform 0.2s` → `var(--transition-transform)`
- **Fade transitions**: `opacity 0.2s` → `var(--transition-opacity)`
- **Added missing expand-fade transition** for proper Vue transition support

### VisualizerContainer.vue

- **Container morphing**: `800ms/1000ms` → `var(--transition-morphing)` (1s)
- **Box shadows**: `500ms/400ms` → `var(--animation-slower)` (0.5s)
- **Reduced motion**: `0.1s` → `var(--animation-fast)`

### Component-Specific Updates

#### TouchTest.vue

- **Drag transitions**: `0.3s` → `var(--animation-slow)`
- **Pulse animation**: `2s` → `var(--animation-celebration)`
- **Fade animations**: `2s` → `var(--animation-celebration)`
- **Circle animations**: `0.6s` → `var(--animation-extra-slow)`
- **Checkmark animations**: `0.4s` → `var(--animation-slower)`
- **Stroke animations**: `0.1s` → `var(--animation-fast)`

#### MouseTest.vue

- **Button press**: `0.1s` → `var(--animation-fast)`
- **Button release**: `0.15s` → `var(--animation-fast)`

#### KeyboardTest.vue

- **Key press transitions**: `0.05s` → `var(--animation-instant)`
- **Key animations**: `0.1s` → `var(--animation-fast)`
- **Key release**: `0.15s` → `var(--animation-fast)`

#### TestActionButtons.vue

- **Container transitions**: `100ms` → `var(--animation-fast)`
- **Button transitions**: `0.2s` → `var(--transition-default)`

#### TestsCompleted.vue

- **Confetti animations**: `3s/2s` → `var(--animation-celebration)`
- **Circle drawing**: `0.8s` → `var(--animation-extra-slow)`
- **Checkmark drawing**: `0.4s` → `var(--animation-slower)`
- **Progress transitions**: `0.6s` → `var(--animation-extra-slow)`

#### SpeakerTest.vue

- **Wave animations**: `1s` → `var(--animation-morphing)`
- **Animation delays**: `-0.5s` → `calc(-1 * var(--animation-slower))`

#### BatteryTest.vue

- **Circle animations**: `0.6s` → `var(--animation-extra-slow)`
- **Checkmark animations**: `0.4s` → `var(--animation-slower)`

#### TestSpinner.vue

- **Spin animations**: `1s` → `var(--animation-morphing)`
- **Dash animations**: `1.2s` → `calc(var(--animation-morphing) * 1.2)`

#### StatePanel.vue

- **Loading spinners**: `1s` → `var(--animation-morphing)`

## Benefits

1. **Consistency**: All animations now use standardized durations
2. **Maintainability**: Single source of truth for animation timing
3. **Accessibility**: Easier to implement reduced motion preferences
4. **Performance**: Reduced CSS bundle size through variable reuse
5. **Design System**: Clear animation hierarchy and purpose

## Animation Hierarchy

- **Instant (0.05s)**: Immediate user feedback
- **Fast (0.1s)**: Button presses, quick state changes
- **Normal (0.2s)**: Standard UI transitions
- **Slow (0.3s)**: Deliberate state changes, width adjustments
- **Slower (0.5s)**: Emphasized transitions
- **Extra Slow (0.8s)**: Success animations
- **Morphing (1s)**: Container shape changes, loading spinners
- **Celebration (2s)**: Completion effects, party animations

## Future Improvements

1. Consider adding easing function variables for consistency
2. Implement automatic reduced motion support
3. Add animation performance monitoring
4. Create animation testing guidelines
