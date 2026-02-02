import { onMounted, onUnmounted, ref, type Ref } from 'vue';

interface EventListener {
    target: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
}

/**
 * Composable for managing event listeners with automatic cleanup
 * Provides a centralized way to add/remove event listeners with lifecycle hooks
 */
export function useEventListeners() {
    const listeners: Ref<EventListener[]> = ref([]);

    /**
     * Add an event listener with automatic cleanup on unmount
     */
    const addEventListener = (
        target: EventTarget | string,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: boolean | AddEventListenerOptions = {}
    ) => {
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
    const removeEventListener = (
        target: EventTarget | string,
        event: string,
        handler: EventListenerOrEventListenerObject
    ) => {
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
export function useWindowResize(handler: (event?: Event) => void, immediate = false) {
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

/** @ignore */
interface MouseEventHandlers {
    onMouseDown?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onWheel?: (event: WheelEvent) => void;
    onContextMenu?: (event: MouseEvent) => void;
    onAuxClick?: (event: MouseEvent) => void;
}

/** @ignore */
interface KeyboardEventHandlers {
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
}

/**
 * Composable for mouse/pointer events (useful for MouseTest, TouchTest)
 * @ignore
 */
export function usePointerEvents() {
    const { addEventListener } = useEventListeners();

    const addPointerListener = (
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: boolean | AddEventListenerOptions = {}
    ) => {
        addEventListener(window, event, handler, options);
    };

    const addMouseListeners = (handlers: MouseEventHandlers = {}) => {
        const { onMouseDown, onMouseUp, onMouseMove, onWheel, onContextMenu, onAuxClick } =
            handlers;

        if (onMouseDown) addPointerListener('mousedown', onMouseDown as EventListenerOrEventListenerObject);
        if (onMouseUp) addPointerListener('mouseup', onMouseUp as EventListenerOrEventListenerObject);
        if (onMouseMove) addPointerListener('mousemove', onMouseMove as EventListenerOrEventListenerObject);
        if (onWheel) addPointerListener('wheel', onWheel as EventListenerOrEventListenerObject);
        if (onContextMenu) addPointerListener('contextmenu', onContextMenu as EventListenerOrEventListenerObject);
        if (onAuxClick) addPointerListener('auxclick', onAuxClick as EventListenerOrEventListenerObject);
    };

    const addKeyboardListeners = (handlers: KeyboardEventHandlers = {}) => {
        const { onKeyDown, onKeyUp } = handlers;

        if (onKeyDown) addPointerListener('keydown', onKeyDown as EventListenerOrEventListenerObject);
        if (onKeyUp) addPointerListener('keyup', onKeyUp as EventListenerOrEventListenerObject);
    };

    return {
        addPointerListener,
        addMouseListeners,
        addKeyboardListeners,
    };
}