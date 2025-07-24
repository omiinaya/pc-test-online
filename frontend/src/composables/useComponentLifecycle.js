import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';

/**
 * Composable for managing common component lifecycle patterns
 * Especially useful for test components with keep-alive behavior
 */
export function useComponentLifecycle(options = {}) {
    const { autoInitialize = true, pauseOnDeactivate = true, cleanupOnUnmount = true } = options;

    const isActive = ref(true);
    const isInitialized = ref(false);
    const initializationCallbacks = ref([]);
    const cleanupCallbacks = ref([]);
    const pauseCallbacks = ref([]);
    const resumeCallbacks = ref([]);

    /**
     * Add initialization callback
     */
    const onInitialize = callback => {
        initializationCallbacks.value.push(callback);
    };

    /**
     * Add cleanup callback
     */
    const onCleanup = callback => {
        cleanupCallbacks.value.push(callback);
    };

    /**
     * Add pause callback (called on deactivate)
     */
    const onPause = callback => {
        pauseCallbacks.value.push(callback);
    };

    /**
     * Add resume callback (called on activate)
     */
    const onResume = callback => {
        resumeCallbacks.value.push(callback);
    };

    /**
     * Initialize component
     * Can accept an optional callback for immediate initialization
     */
    const initialize = async callback => {
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
    const cleanup = async callback => {
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
    const pause = async () => {
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
    const resume = async () => {
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
export function useTimers() {
    const timers = ref([]);

    const setTimeout = (callback, delay) => {
        const id = window.setTimeout(callback, delay);
        timers.value.push({ type: 'timeout', id });
        return id;
    };

    const setInterval = (callback, delay) => {
        const id = window.setInterval(callback, delay);
        timers.value.push({ type: 'interval', id });
        return id;
    };

    const clearTimeout = id => {
        window.clearTimeout(id);
        timers.value = timers.value.filter(timer => timer.id !== id);
    };

    const clearInterval = id => {
        window.clearInterval(id);
        timers.value = timers.value.filter(timer => timer.id !== id);
    };

    const clearAllTimers = () => {
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
