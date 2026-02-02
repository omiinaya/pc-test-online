import { ref, type Ref } from 'vue';
import type { EasingFunction, AnimationOptions, CheckmarkAnimationOptions } from '../types';

export interface UseAnimationsReturn {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
  cleanupAnimations: () => void;
  createDelayedAnimation: (callback: FrameRequestCallback, delay?: number) => () => void;
  animateValue: (options: AnimationOptions) => void;
}

export interface UseCheckmarkAnimationReturn {
  isAnimating: Ref<boolean>;
  animateCheckmark: (element: SVGElement | null, options?: CheckmarkAnimationOptions) => void;
}

export interface UseTransitionControlReturn {
  transitionsEnabled: Ref<boolean>;
  enableTransitions: (delay?: number) => void;
  disableTransitions: () => void;
}

/**
 * Composable for managing common animation patterns
 */
export function useAnimations(): UseAnimationsReturn {
  const animationFrames: Ref<number[]> = ref([]);
  const runningAnimations: Ref<Set<number>> = ref(new Set());

  /**
   * Request animation frame with automatic cleanup
   */
  const requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = window.requestAnimationFrame(callback);
    animationFrames.value.push(id);
    return id;
  };

  /**
   * Cancel animation frame
   */
  const cancelAnimationFrame = (id: number): void => {
    window.cancelAnimationFrame(id);
    animationFrames.value = animationFrames.value.filter(frameId => frameId !== id);
  };

  /**
   * Clean up all animation frames
   */
  const cleanupAnimations = (): void => {
    animationFrames.value.forEach(id => {
      window.cancelAnimationFrame(id);
    });
    animationFrames.value = [];
    runningAnimations.value.clear();
  };

  /**
   * Create a delayed animation with automatic cleanup
   */
  const createDelayedAnimation = (callback: FrameRequestCallback, delay: number = 0): (() => void) => {
    const timeoutId = setTimeout(() => {
      const animId = requestAnimationFrame(callback);
      runningAnimations.value.add(animId);
    }, delay);

    return (): void => {
      clearTimeout(timeoutId);
    };
  };

  /**
   * Animate a value over time using requestAnimationFrame
   */
  const animateValue = (options: AnimationOptions): void => {
    const {
      from = 0,
      to = 1,
      duration = 1000,
      easing = (t: number): number => t, // linear by default
      onUpdate = (): void => {},
      onComplete = (): void => {},
    } = options;

    const startTime = Date.now();
    const range = to - from;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const value = from + range * easedProgress;

      onUpdate(value, progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete(to);
      }
    };

    requestAnimationFrame(animate);
  };

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    cleanupAnimations,
    createDelayedAnimation,
    animateValue,
  };
}

/**
 * Composable for checkmark animations (used in multiple components)
 */
export function useCheckmarkAnimation(): UseCheckmarkAnimationReturn {
  const isAnimating: Ref<boolean> = ref(false);

  const animateCheckmark = (element: SVGElement | null, options: CheckmarkAnimationOptions = {}): void => {
    const { duration = 600, delay = 0, onComplete = (): void => {} } = options;

    if (!element) return;

    isAnimating.value = true;

    // Set initial state
    const totalLength = element.getTotalLength?.() || 50;
    element.style.strokeDasharray = totalLength.toString();
    element.style.strokeDashoffset = totalLength.toString();

    setTimeout(() => {
      element.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
      element.style.strokeDashoffset = '0';

      setTimeout(() => {
        isAnimating.value = false;
        onComplete();
      }, duration);
    }, delay);
  };

  return {
    isAnimating,
    animateCheckmark,
  };
}

/**
 * Composable for transition enabling (TouchTest pattern)
 */
export function useTransitionControl(): UseTransitionControlReturn {
  const transitionsEnabled: Ref<boolean> = ref(false);

  const enableTransitions = (delay: number = 350): void => {
    setTimeout(() => {
      transitionsEnabled.value = true;
    }, delay);
  };

  const disableTransitions = (): void => {
    transitionsEnabled.value = false;
  };

  return {
    transitionsEnabled,
    enableTransitions,
    disableTransitions,
  };
}

/**
 * Common easing functions for animations
 */
export const easingFunctions: Record<string, EasingFunction> = {
  linear: (t: number): number => t,
  easeIn: (t: number): number => t * t,
  easeOut: (t: number): number => t * (2 - t),
  easeInOut: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
};