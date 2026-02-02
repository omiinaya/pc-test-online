import { onMounted, onUnmounted, ref, type Ref } from 'vue';

export interface EventListenerEntry {
  target: EventTarget;
  event: string;
  handler: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
}

export interface UseEventListenersReturn {
  addEventListener: (
    target: EventTarget | string,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ) => void;
  removeEventListener: (
    target: EventTarget | string,
    event: string,
    handler: EventListenerOrEventListenerObject
  ) => void;
  cleanupAllListeners: () => void;
}

export interface MouseEventHandlers {
  onMouseDown?: (event: MouseEvent) => void;
  onMouseUp?: (event: MouseEvent) => void;
  onMouseMove?: (event: MouseEvent) => void;
  onWheel?: (event: WheelEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  onAuxClick?: (event: MouseEvent) => void;
}

export interface KeyboardEventHandlers {
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
}

export interface UsePointerEventsReturn {
  addPointerListener: (
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ) => void;
  addMouseListeners: (handlers?: MouseEventHandlers) => void;
  addKeyboardListeners: (handlers?: KeyboardEventHandlers) => void;
}

/**
 * Composable for managing event listeners with automatic cleanup
 * Provides a centralized way to add/remove event listeners with lifecycle hooks
 */
export function useEventListeners(): UseEventListenersReturn {
  const listeners: Ref<EventListenerEntry[]> = ref([]);

  /**
   * Add an event listener with automatic cleanup on unmount
   */
  const addEventListener = (
    target: EventTarget | string,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions | boolean = {}
  ): void => {
    const targetElement: EventTarget = typeof target === 'string' ? window : target;

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
  ): void => {
    const targetElement: EventTarget = typeof target === 'string' ? window : target;
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
  const cleanupAllListeners = (): void => {
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
export function useWindowResize(
  handler: EventListenerOrEventListenerObject,
  immediate: boolean = false
): { handler: EventListenerOrEventListenerObject } {
  const { addEventListener } = useEventListeners();

  onMounted(() => {
    addEventListener(window, 'resize', handler);
    if (immediate) {
      // Trigger the handler immediately
      if (typeof handler === 'function') {
        handler(new Event('resize') as any);
      }
    }
  });

  return {
    handler,
  };
}

/**
 * Composable for mouse/pointer events (useful for MouseTest, TouchTest)
 */
export function usePointerEvents(): UsePointerEventsReturn {
  const { addEventListener } = useEventListeners();

  const addPointerListener = (
    event: string,
    handler: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions | boolean = {}
  ): void => {
    addEventListener(window, event, handler, options);
  };

  const addMouseListeners = (handlers: MouseEventHandlers = {}): void => {
    const { onMouseDown, onMouseUp, onMouseMove, onWheel, onContextMenu, onAuxClick } = handlers;

    if (onMouseDown) addPointerListener('mousedown', onMouseDown as EventListener);
    if (onMouseUp) addPointerListener('mouseup', onMouseUp as EventListener);
    if (onMouseMove) addPointerListener('mousemove', onMouseMove as EventListener);
    if (onWheel) addPointerListener('wheel', onWheel as EventListener);
    if (onContextMenu) addPointerListener('contextmenu', onContextMenu as EventListener);
    if (onAuxClick) addPointerListener('auxclick', onAuxClick as EventListener);
  };

  const addKeyboardListeners = (handlers: KeyboardEventHandlers = {}): void => {
    const { onKeyDown, onKeyUp } = handlers;

    if (onKeyDown) addPointerListener('keydown', onKeyDown as EventListener);
    if (onKeyUp) addPointerListener('keyup', onKeyUp as EventListener);
  };

  return {
    addPointerListener,
    addMouseListeners,
    addKeyboardListeners,
  };
}