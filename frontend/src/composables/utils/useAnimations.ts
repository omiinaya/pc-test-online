import { ref, type Ref } from 'vue';

/** @ignore */
interface AnimationOptions {
    from?: number;
    to?: number;
    duration?: number;
    easing?: (t: number) => number;
    onUpdate?: (value: number, progress: number) => void;
    onComplete?: (finalValue: number) => void;
}

/** @ignore */
interface CheckmarkAnimationOptions {
    duration?: number;
    delay?: number;
    onComplete?: () => void;
}

/**
 * Composable for managing common animation patterns
 * @ignore
 */
export function useAnimations() {
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
    const cancelAnimationFrame = (id: number) => {
        window.cancelAnimationFrame(id);
        animationFrames.value = animationFrames.value.filter(frameId => frameId !== id);
    };

    /**
     * Clean up all animation frames
     */
    const cleanupAnimations = () => {
        animationFrames.value.forEach(id => {
            window.cancelAnimationFrame(id);
        });
        animationFrames.value = [];
        runningAnimations.value.clear();
    };

    /**
     * Create a delayed animation with automatic cleanup
     */
    const createDelayedAnimation = (callback: FrameRequestCallback, delay = 0): (() => void) => {
        const timeoutId = setTimeout(() => {
            const animId = requestAnimationFrame(callback);
            runningAnimations.value.add(animId);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
        };
    };

    /**
     * Animate a value over time using requestAnimationFrame
     */
    const animateValue = (options: AnimationOptions = {}) => {
        const {
            from = 0,
            to = 1,
            duration = 1000,
            easing = (t: number) => t, // linear by default
            onUpdate = () => {},
            onComplete = () => {},
        } = options;

        const startTime = Date.now();
        const range = to - from;

        const animate = () => {
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
 * @ignore
 */
export function useCheckmarkAnimation() {
    const isAnimating: Ref<boolean> = ref(false);

    const animateCheckmark = (
        element: HTMLElement | SVGElement | null,
        options: CheckmarkAnimationOptions = {}
    ) => {
        const { duration = 600, delay = 0, onComplete = () => {} } = options;

        if (!element) return;

        isAnimating.value = true;

        // Set initial state
        const totalLength = (element as SVGElement).getTotalLength?.() || 50;
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
export function useTransitionControl() {
    const transitionsEnabled: Ref<boolean> = ref(false);

    const enableTransitions = (delay = 350) => {
        setTimeout(() => {
            transitionsEnabled.value = true;
        }, delay);
    };

    const disableTransitions = () => {
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
export const easingFunctions = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => --t * t * t + 1,
    easeInOutCubic: (t: number) =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};
