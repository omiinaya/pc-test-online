import { onMounted, onUnmounted, ref } from 'vue';

/**
 * Composable for managing event listeners with automatic cleanup
 * Provides a centralized way to add/remove event listeners with lifecycle hooks
 */
export function useEventListeners() {
    const listeners = ref([]);

    /**
     * Add an event listener with automatic cleanup on unmount
     */
    const addEventListener = (target, event, handler, options = {}) => {
        const targetElement = typeof target === 'string' ? window : target;

        targetElement.addEventListener(event, handler, options);

        // Store reference for cleanup
        listeners.value.push({
            target: targetElement,
            event,
            handler,
            options,
        });
    };

    /**
     * Remove a specific event listener
     */
    const removeEventListener = (target, event, handler) => {
        const targetElement = typeof target === 'string' ? window : target;
        targetElement.removeEventListener(event, handler);

        // Remove from tracked listeners
        listeners.value = listeners.value.filter(
            listener =>
                !(
                    listener.target === targetElement &&
                    listener.event === event &&
                    listener.handler === handler
                )
        );
    };

    /**
     * Clean up all tracked event listeners
     */
    const cleanupAllListeners = () => {
        listeners.value.forEach(({ target, event, handler }) => {
            target.removeEventListener(event, handler);
        });
        listeners.value = [];
    };

    // Automatic cleanup on unmount
    onUnmounted(() => {
        cleanupAllListeners();
    });

    return {
        addEventListener,
        removeEventListener,
        cleanupAllListeners,
    };
}

/**
 * Composable specifically for window resize events
 */
export function useWindowResize(handler, immediate = false) {
    const { addEventListener } = useEventListeners();

    onMounted(() => {
        addEventListener(window, 'resize', handler);
        if (immediate) {
            handler();
        }
    });

    return {
        handler,
    };
}

/**
 * Composable for mouse/pointer events (useful for MouseTest, TouchTest)
 */
export function usePointerEvents() {
    const { addEventListener } = useEventListeners();

    const addPointerListener = (event, handler, options = {}) => {
        addEventListener(window, event, handler, options);
    };

    const addMouseListeners = (handlers = {}) => {
        const { onMouseDown, onMouseUp, onMouseMove, onWheel, onContextMenu, onAuxClick } =
            handlers;

        if (onMouseDown) addPointerListener('mousedown', onMouseDown);
        if (onMouseUp) addPointerListener('mouseup', onMouseUp);
        if (onMouseMove) addPointerListener('mousemove', onMouseMove);
        if (onWheel) addPointerListener('wheel', onWheel);
        if (onContextMenu) addPointerListener('contextmenu', onContextMenu);
        if (onAuxClick) addPointerListener('auxclick', onAuxClick);
    };

    const addKeyboardListeners = (handlers = {}) => {
        const { onKeyDown, onKeyUp } = handlers;

        if (onKeyDown) addPointerListener('keydown', onKeyDown);
        if (onKeyUp) addPointerListener('keyup', onKeyUp);
    };

    return {
        addPointerListener,
        addMouseListeners,
        addKeyboardListeners,
    };
}
