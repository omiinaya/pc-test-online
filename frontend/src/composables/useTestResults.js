import { ref, computed } from 'vue';

/**
 * Composable for managing test result patterns and emit standardization
 */
export function useTestResults(testType, emit) {
    const testStatus = ref('pending'); // 'pending', 'running', 'completed', 'failed', 'skipped'
    const testStartTime = ref(null);
    const testEndTime = ref(null);
    const testAttempts = ref(0);
    const lastError = ref(null);

    const testDuration = computed(() => {
        if (!testStartTime.value || !testEndTime.value) return null;
        return testEndTime.value - testStartTime.value;
    });

    const isTestRunning = computed(() => testStatus.value === 'running');
    const isTestCompleted = computed(() => testStatus.value === 'completed');
    const isTestFailed = computed(() => testStatus.value === 'failed');
    const isTestSkipped = computed(() => testStatus.value === 'skipped');

    /**
     * Start the test
     */
    const startTest = () => {
        testStatus.value = 'running';
        testStartTime.value = Date.now();
        testEndTime.value = null;
        testAttempts.value += 1;
        lastError.value = null;
    };

    /**
     * Complete the test successfully
     */
    const completeTest = (additionalData = {}) => {
        if (testStatus.value === 'completed') return;

        // Auto-start test if it hasn't been started yet
        if (testStatus.value === 'pending') {
            startTest();
        }

        testStatus.value = 'completed';
        testEndTime.value = Date.now();

        const resultData = {
            testType,
            status: 'completed',
            duration: testDuration.value,
            attempts: testAttempts.value,
            timestamp: new Date().toISOString(),
            ...additionalData,
        };

        emit('test-completed', testType, resultData);
    };

    /**
     * Fail the test
     */
    const failTest = (reason = '', additionalData = {}) => {
        if (testStatus.value === 'failed') return;

        // Auto-start test if it hasn't been started yet
        if (testStatus.value === 'pending') {
            startTest();
        }

        testStatus.value = 'failed';
        testEndTime.value = Date.now();
        lastError.value = reason;

        const resultData = {
            testType,
            status: 'failed',
            duration: testDuration.value,
            attempts: testAttempts.value,
            error: reason,
            timestamp: new Date().toISOString(),
            ...additionalData,
        };

        console.error(`${testType} test failed:`, reason);
        emit('test-failed', testType, resultData);
    };

    /**
     * Skip the test
     */
    const skipTest = (reason = '', additionalData = {}) => {
        if (testStatus.value === 'skipped') return;

        testStatus.value = 'skipped';
        testEndTime.value = Date.now();

        const resultData = {
            testType,
            status: 'skipped',
            duration: testDuration.value,
            attempts: testAttempts.value,
            reason,
            timestamp: new Date().toISOString(),
            ...additionalData,
        };

        emit('test-skipped', testType, resultData);
    };

    /**
     * Reset the test to initial state
     */
    const resetTest = () => {
        testStatus.value = 'pending';
        testStartTime.value = null;
        testEndTime.value = null;
        testAttempts.value = 0;
        lastError.value = null;
    };

    /**
     * Retry the test (reset and start)
     */
    const retryTest = () => {
        resetTest();
        startTest();
    };

    return {
        // State
        testStatus,
        testStartTime,
        testEndTime,
        testAttempts,
        lastError,
        testDuration,

        // Computed
        isTestRunning,
        isTestCompleted,
        isTestFailed,
        isTestSkipped,

        // Methods
        startTest,
        completeTest,
        failTest,
        skipTest,
        resetTest,
        retryTest,
    };
}

/**
 * Composable for standardized action button states
 */
export function useActionButtons() {
    const actionsDisabled = ref(false);
    const actionStates = ref({
        working: { disabled: false, loading: false },
        notWorking: { disabled: false, loading: false },
        skip: { disabled: false, loading: false },
    });

    const disableAllActions = () => {
        actionsDisabled.value = true;
        Object.keys(actionStates.value).forEach(key => {
            actionStates.value[key].disabled = true;
        });
    };

    const enableAllActions = () => {
        actionsDisabled.value = false;
        Object.keys(actionStates.value).forEach(key => {
            actionStates.value[key].disabled = false;
        });
    };

    const setActionState = (action, state) => {
        if (actionStates.value[action]) {
            actionStates.value[action] = { ...actionStates.value[action], ...state };
        }
    };

    const setActionLoading = (action, loading = true) => {
        setActionState(action, { loading, disabled: loading });
    };

    return {
        actionsDisabled,
        actionStates,
        disableAllActions,
        enableAllActions,
        setActionState,
        setActionLoading,
    };
}

/**
 * Composable for test progress tracking
 */
export function useTestProgress(totalSteps = 1) {
    const currentStep = ref(0);
    const completedSteps = ref([]);
    const stepData = ref({});

    const progress = computed(() => {
        return totalSteps > 0 ? (currentStep.value / totalSteps) * 100 : 0;
    });

    const isComplete = computed(() => {
        return currentStep.value >= totalSteps;
    });

    const nextStep = (data = {}) => {
        if (currentStep.value < totalSteps) {
            stepData.value[currentStep.value] = data;
            completedSteps.value.push(currentStep.value);
            currentStep.value += 1;
        }
    };

    const setStep = (step, data = {}) => {
        if (step >= 0 && step <= totalSteps) {
            currentStep.value = step;
            stepData.value[step] = data;
        }
    };

    const resetProgress = () => {
        currentStep.value = 0;
        completedSteps.value = [];
        stepData.value = {};
    };

    return {
        currentStep,
        completedSteps,
        stepData,
        progress,
        isComplete,
        nextStep,
        setStep,
        resetProgress,
    };
}
