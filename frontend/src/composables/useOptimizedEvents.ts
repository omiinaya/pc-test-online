import { onUnmounted, getCurrentInstance } from 'vue';
import { debounce, throttle } from '../utils/debounce';

export interface OptimizedEventOptions {
    debounce?: number;
    throttle?: number;
    passive?: boolean;
    capture?: boolean;
}

export function useOptimizedEvents() {
    const listeners = new Map<string, () => void>();

    const addOptimizedEventListener = <K extends keyof WindowEventMap | string>(
        target: Window | Document | HTMLElement,
        type: K,
        listener: EventListenerOrEventListenerObject,
        options?: OptimizedEventOptions
    ): (() => void) => {
        const { debounce: debounceMs, throttle: throttleMs, ...eventOptions } = options || {};

        let optimizedListener: EventListenerOrEventListenerObject = listener;

        if (debounceMs) {
            optimizedListener = debounce(
                listener as EventListener,
                debounceMs
            ) as EventListenerOrEventListenerObject;
        } else if (throttleMs) {
            optimizedListener = throttle(
                listener as EventListener,
                throttleMs
            ) as EventListenerOrEventListenerObject;
        }

        // Conditionally include options only if there are properties
        const hasEventOptions = Object.keys(eventOptions).length > 0;

        if (hasEventOptions) {
            target.addEventListener(type, optimizedListener, eventOptions);
        } else {
            target.addEventListener(type, optimizedListener);
        }

        const removeListener = () => {
            if (hasEventOptions) {
                target.removeEventListener(type, optimizedListener, eventOptions);
            } else {
                target.removeEventListener(type, optimizedListener);
            }
            listeners.delete(type);
        };

        listeners.set(type, removeListener);
        return removeListener;
    };

    // Common optimized events
    const addResizeListener = (
        listener: (this: Window, ev: UIEvent) => void,
        options?: OptimizedEventOptions
    ) => {
        return addOptimizedEventListener(window, 'resize', listener as EventListener, {
            debounce: 250,
            passive: true,
            ...options,
        });
    };

    const addScrollListener = (
        listener: (this: Window, ev: Event) => void,
        options?: OptimizedEventOptions
    ) => {
        return addOptimizedEventListener(window, 'scroll', listener as EventListener, {
            throttle: 100,
            passive: true,
            ...options,
        });
    };

    const addInputListener = (
        target: HTMLElement,
        listener: (this: HTMLElement, ev: Event) => void,
        options?: OptimizedEventOptions
    ) => {
        return addOptimizedEventListener(target, 'input', listener as EventListener, {
            debounce: 300,
            ...options,
        });
    };

    const addVisibilityChangeListener = (
        listener: (this: Document, ev: Event) => void,
        options?: OptimizedEventOptions
    ) => {
        return addOptimizedEventListener(
            document,
            'visibilitychange',
            listener as EventListener,
            options
        );
    };

    // Cleanup all listeners
    const cleanupAll = () => {
        listeners.forEach(removeListener => removeListener());
        listeners.clear();
    };

    // Auto-cleanup if within a component
    if (getCurrentInstance()) {
        onUnmounted(() => {
            cleanupAll();
        });
    }

    return {
        addOptimizedEventListener,
        addResizeListener,
        addScrollListener,
        addInputListener,
        addVisibilityChangeListener,
        cleanupAll,
    };
}
