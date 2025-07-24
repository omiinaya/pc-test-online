import { ref } from 'vue';

/**
 * Composable for managing common animation patterns
 */
export function useAnimations() {
    const animationFrames = ref([]);
    const runningAnimations = ref(new Set());

    /**
     * Request animation frame with automatic cleanup
     */
    const requestAnimationFrame = callback => {
        const id = window.requestAnimationFrame(callback);
        animationFrames.value.push(id);
        return id;
    };

    /**
     * Cancel animation frame
     */
    const cancelAnimationFrame = id => {
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
    const createDelayedAnimation = (callback, delay = 0) => {
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
    const animateValue = (options = {}) => {
        const {
            from = 0,
            to = 1,
            duration = 1000,
            easing = t => t, // linear by default
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
 */
export function useCheckmarkAnimation() {
    const isAnimating = ref(false);

    const animateCheckmark = (element, options = {}) => {
        const { duration = 600, delay = 0, onComplete = () => {} } = options;

        if (!element) return;

        isAnimating.value = true;

        // Set initial state
        element.style.strokeDasharray = element.getTotalLength?.() || '50';
        element.style.strokeDashoffset = element.getTotalLength?.() || '50';

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
    const transitionsEnabled = ref(false);

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
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: t => t * t * t,
    easeOutCubic: t => --t * t * t + 1,
    easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
};
