// Common test utilities and patterns
import { ref } from 'vue';

/**
 * Composable for common test state patterns across different test components
 */
export function useCommonTestPatterns() {
    const actionsDisabled = ref(true);
    const loading = ref(false);
    const error = ref(null);
    const skipped = ref(false);
    const testCompleted = ref(false);

    // Common test completion handlers
    const handleTestPass = (testType, emitCallback) => {
        testCompleted.value = true;
        actionsDisabled.value = true;
        if (emitCallback) {
            emitCallback('test-completed', {
                type: testType,
                status: 'passed',
                timestamp: Date.now(),
            });
        }
    };

    const handleTestFail = (testType, errorMessage, emitCallback) => {
        error.value = errorMessage;
        actionsDisabled.value = true;
        if (emitCallback) {
            emitCallback('test-failed', {
                type: testType,
                status: 'failed',
                error: errorMessage,
                timestamp: Date.now(),
            });
        }
    };

    const handleTestSkip = (testType, emitCallback) => {
        skipped.value = true;
        actionsDisabled.value = true;
        if (emitCallback) {
            emitCallback('test-skipped', {
                type: testType,
                status: 'skipped',
                timestamp: Date.now(),
            });
        }
    };

    const resetTestState = () => {
        actionsDisabled.value = true;
        loading.value = false;
        error.value = null;
        skipped.value = false;
        testCompleted.value = false;
    };

    return {
        // State
        actionsDisabled,
        loading,
        error,
        skipped,
        testCompleted,

        // Methods
        handleTestPass,
        handleTestFail,
        handleTestSkip,
        resetTestState,
    };
}

/**
 * Composable for managing device change handlers
 */
export function useDeviceChangeHandler() {
    const handleDeviceChange = async (newDeviceId, currentDeviceId, switchDeviceCallback) => {
        if (newDeviceId !== currentDeviceId && switchDeviceCallback) {
            try {
                await switchDeviceCallback(newDeviceId);
            } catch (error) {
                console.error('Failed to switch device:', error);
                throw new Error(`Failed to switch to selected device: ${error.message}`);
            }
        }
    };

    return {
        handleDeviceChange,
    };
}

/**
 * Composable for managing skip timers and timeouts
 */
export function useTestTimers() {
    const skipTimer = ref(null);
    const testTimeout = ref(null);

    const startSkipTimer = (callback, delay = 10000) => {
        if (skipTimer.value) clearTimeout(skipTimer.value);

        skipTimer.value = setTimeout(() => {
            if (callback) callback();
            skipTimer.value = null;
        }, delay);
    };

    const clearSkipTimer = () => {
        if (skipTimer.value) {
            clearTimeout(skipTimer.value);
            skipTimer.value = null;
        }
    };

    const startTestTimeout = (callback, delay = 30000) => {
        if (testTimeout.value) clearTimeout(testTimeout.value);

        testTimeout.value = setTimeout(() => {
            if (callback) callback();
            testTimeout.value = null;
        }, delay);
    };

    const clearTestTimeout = () => {
        if (testTimeout.value) {
            clearTimeout(testTimeout.value);
            testTimeout.value = null;
        }
    };

    const clearAllTimers = () => {
        clearSkipTimer();
        clearTestTimeout();
    };

    return {
        skipTimer,
        testTimeout,
        startSkipTimer,
        clearSkipTimer,
        startTestTimeout,
        clearTestTimeout,
        clearAllTimers,
    };
}
