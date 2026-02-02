import { ref, onMounted, onUnmounted, onActivated, onDeactivated, type Ref } from 'vue';

export interface ComponentLifecycleOptions {
  autoInitialize?: boolean;
  pauseOnDeactivate?: boolean;
  cleanupOnUnmount?: boolean;
}

export interface TimerEntry {
  type: 'timeout' | 'interval';
  id: number;
}

export interface UseComponentLifecycleReturn {
  isActive: Ref<boolean>;
  isInitialized: Ref<boolean>;
  initialize: (callback?: () => Promise<void> | void) => Promise<void>;
  cleanup: (callback?: () => Promise<void> | void) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  onInitialize: (callback: () => Promise<void> | void) => void;
  onCleanup: (callback: () => Promise<void> | void) => void;
  onPause: (callback: () => Promise<void> | void) => void;
  onResume: (callback: () => Promise<void> | void) => void;
}

export interface UseTimersReturn {
  setTimeout: (callback: TimerHandler, delay?: number) => number;
  setInterval: (callback: TimerHandler, delay?: number) => number;
  clearTimeout: (id: number) => void;
  clearInterval: (id: number) => void;
  clearAllTimers: () => void;
}

/**
 * Composable for managing common component lifecycle patterns
 * Especially useful for test components with keep-alive behavior
 */
export function useComponentLifecycle(options: ComponentLifecycleOptions = {}): UseComponentLifecycleReturn {
  const { autoInitialize = true, pauseOnDeactivate = true, cleanupOnUnmount = true } = options;

  const isActive: Ref<boolean> = ref(true);
  const isInitialized: Ref<boolean> = ref(false);
  const initializationCallbacks: Ref<Array<() => Promise<void> | void>> = ref([]);
  const cleanupCallbacks: Ref<Array<() => Promise<void> | void>> = ref([]);
  const pauseCallbacks: Ref<Array<() => Promise<void> | void>> = ref([]);
  const resumeCallbacks: Ref<Array<() => Promise<void> | void>> = ref([]);

  /**
   * Add initialization callback
   */
  const onInitialize = (callback: () => Promise<void> | void): void => {
    initializationCallbacks.value.push(callback);
  };

  /**
   * Add cleanup callback
   */
  const onCleanup = (callback: () => Promise<void> | void): void => {
    cleanupCallbacks.value.push(callback);
  };

  /**
   * Add pause callback (called on deactivate)
   */
  const onPause = (callback: () => Promise<void> | void): void => {
    pauseCallbacks.value.push(callback);
  };

  /**
   * Add resume callback (called on activate)
   */
  const onResume = (callback: () => Promise<void> | void): void => {
    resumeCallbacks.value.push(callback);
  };

  /**
   * Initialize component
   * Can accept an optional callback for immediate initialization
   */
  const initialize = async (callback?: () => Promise<void> | void): Promise<void> => {
    // If callback is provided, add it
    if (callback) {
      onInitialize(callback);
    }

    // If already initialized and we have a callback, execute it immediately
    if (isInitialized.value && callback) {
      try {
        await callback();
      } catch (error) {
        console.error('Immediate callback failed:', error);
      }
      return;
    }

    if (isInitialized.value) {
      return;
    }

    for (const callback of initializationCallbacks.value) {
      try {
        await callback();
      } catch (error) {
        console.error('Initialization callback failed:', error);
      }
    }

    isInitialized.value = true;
  };

  /**
   * Cleanup component
   * Can accept an optional callback for immediate cleanup registration
   */
  const cleanup = async (callback?: () => Promise<void> | void): Promise<void> => {
    // If callback is provided, add it and run immediately
    if (callback) {
      onCleanup(callback);
    }

    for (const callback of cleanupCallbacks.value) {
      try {
        await callback();
      } catch (error) {
        console.error('Cleanup callback failed:', error);
      }
    }

    isInitialized.value = false;
  };

  /**
   * Pause component (keep-alive deactivated)
   */
  const pause = async (): Promise<void> => {
    if (!isActive.value) return;

    for (const callback of pauseCallbacks.value) {
      try {
        await callback();
      } catch (error) {
        console.error('Pause callback failed:', error);
      }
    }

    isActive.value = false;
  };

  /**
   * Resume component (keep-alive activated)
   */
  const resume = async (): Promise<void> => {
    if (isActive.value) return;

    for (const callback of resumeCallbacks.value) {
      try {
        await callback();
      } catch (error) {
        console.error('Resume callback failed:', error);
      }
    }

    isActive.value = true;
  };

  // Lifecycle hooks
  onMounted(() => {
    if (autoInitialize) {
      initialize();
    }
  });

  onActivated(() => {
    resume();
    // Reinitialize if needed (e.g., after error)
    if (!isInitialized.value && autoInitialize) {
      initialize();
    }
  });

  onDeactivated(() => {
    if (pauseOnDeactivate) {
      pause();
    }
  });

  onUnmounted(() => {
    if (cleanupOnUnmount) {
      cleanup();
    }
  });

  return {
    isActive,
    isInitialized,
    initialize,
    cleanup,
    pause,
    resume,
    onInitialize,
    onCleanup,
    onPause,
    onResume,
  };
}

/**
 * Composable for timeout/interval management with automatic cleanup
 */
export function useTimers(): UseTimersReturn {
  const timers: Ref<TimerEntry[]> = ref([]);

  const setTimeout = (callback: TimerHandler, delay?: number): number => {
    const id = window.setTimeout(callback, delay);
    timers.value.push({ type: 'timeout', id });
    return id;
  };

  const setInterval = (callback: TimerHandler, delay?: number): number => {
    const id = window.setInterval(callback, delay);
    timers.value.push({ type: 'interval', id });
    return id;
  };

  const clearTimeout = (id: number): void => {
    window.clearTimeout(id);
    timers.value = timers.value.filter(timer => timer.id !== id);
  };

  const clearInterval = (id: number): void => {
    window.clearInterval(id);
    timers.value = timers.value.filter(timer => timer.id !== id);
  };

  const clearAllTimers = (): void => {
    timers.value.forEach(({ type, id }) => {
      if (type === 'timeout') {
        window.clearTimeout(id);
      } else if (type === 'interval') {
        window.clearInterval(id);
      }
    });
    timers.value = [];
  };

  onUnmounted(() => {
    clearAllTimers();
  });

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    clearAllTimers,
  };
}