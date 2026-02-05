import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { TestType, TestStatus, TestResult } from '../types';

export interface UseTestResultsReturn {
    testStatus: Ref<TestStatus>;
    testStartTime: Ref<number | null>;
    testEndTime: Ref<number | null>;
    testAttempts: Ref<number>;
    lastError: Ref<string | null>;
    testDuration: ComputedRef<number | null>;
    isTestRunning: ComputedRef<boolean>;
    isTestCompleted: ComputedRef<boolean>;
    isTestFailed: ComputedRef<boolean>;
    isTestSkipped: ComputedRef<boolean>;
    startTest: () => void;
    completeTest: (additionalData?: Record<string, unknown>) => void;
    failTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    skipTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    resetTest: () => void;
    retryTest: () => void;
}

export interface UseActionButtonsReturn {
    actionsDisabled: Ref<boolean>;
    actionStates: Ref<Record<string, { disabled: boolean; loading: boolean }>>;
    disableAllActions: () => void;
    enableAllActions: () => void;
    setActionState: (
        action: string,
        state: Partial<{ disabled: boolean; loading: boolean }>
    ) => void;
    setActionLoading: (action: string, loading?: boolean) => void;
}

export interface UseTestProgressReturn {
    currentStep: Ref<number>;
    completedSteps: Ref<number[]>;
    stepData: Ref<Record<number, unknown>>;
    progress: ComputedRef<number>;
    isComplete: ComputedRef<boolean>;
    nextStep: (data?: unknown) => void;
    setStep: (step: number, data?: unknown) => void;
    resetProgress: () => void;
}

/**
 * Composable for managing test result patterns and emit standardization
 */
export function useTestResults(
    testType: TestType,
    emit: (event: string, ...args: unknown[]) => void
): UseTestResultsReturn {
    const testStatus: Ref<TestStatus> = ref('pending');
    const testStartTime: Ref<number | null> = ref(null);
    const testEndTime: Ref<number | null> = ref(null);
    const testAttempts: Ref<number> = ref(0);
    const lastError: Ref<string | null> = ref(null);

    const testDuration: ComputedRef<number | null> = computed(() => {
        if (!testStartTime.value || !testEndTime.value) return null;
        return testEndTime.value - testStartTime.value;
    });

    const isTestRunning: ComputedRef<boolean> = computed(() => testStatus.value === 'running');
    const isTestCompleted: ComputedRef<boolean> = computed(() => testStatus.value === 'completed');
    const isTestFailed: ComputedRef<boolean> = computed(() => testStatus.value === 'failed');
    const isTestSkipped: ComputedRef<boolean> = computed(() => testStatus.value === 'skipped');

    /**
     * Start the test
     */
    const startTest = (): void => {
        testStatus.value = 'running';
        testStartTime.value = Date.now();
        testEndTime.value = null;
        testAttempts.value += 1;
        lastError.value = null;
    };

    /**
     * Complete the test successfully
     */
    const completeTest = (additionalData: Record<string, unknown> = {}): void => {
        if (testStatus.value === 'completed') return;

        // Auto-start test if it hasn't been started yet
        if (testStatus.value === 'pending') {
            startTest();
        }

        testStatus.value = 'completed';
        testEndTime.value = Date.now();

        const resultData: TestResult = {
            testType,
            status: 'completed',
            duration: testDuration.value,
            attempts: testAttempts.value,
            timestamp: new Date().toISOString(),
            ...additionalData,
        } as TestResult;

        emit('test-completed', testType, resultData);
    };

    /**
     * Fail the test
     */
    const failTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        if (testStatus.value === 'failed') return;

        // Auto-start test if it hasn't been started yet
        if (testStatus.value === 'pending') {
            startTest();
        }

        testStatus.value = 'failed';
        testEndTime.value = Date.now();
        lastError.value = reason;

        const resultData: TestResult = {
            testType,
            status: 'failed',
            duration: testDuration.value,
            attempts: testAttempts.value,
            error: reason,
            timestamp: new Date().toISOString(),
            ...additionalData,
        } as TestResult;

        console.error(`${testType} test failed:`, reason);
        emit('test-failed', testType, resultData);
    };

    /**
     * Skip the test
     */
    const skipTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        if (testStatus.value === 'skipped') return;

        testStatus.value = 'skipped';
        testEndTime.value = Date.now();

        const resultData: TestResult = {
            testType,
            status: 'skipped',
            duration: testDuration.value,
            attempts: testAttempts.value,
            reason,
            timestamp: new Date().toISOString(),
            ...additionalData,
        } as TestResult;

        emit('test-skipped', testType, resultData);
    };

    /**
     * Reset the test to initial state
     */
    const resetTest = (): void => {
        testStatus.value = 'pending';
        testStartTime.value = null;
        testEndTime.value = null;
        testAttempts.value = 0;
        lastError.value = null;
    };

    /**
     * Retry the test (reset and start)
     */
    const retryTest = (): void => {
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
export function useActionButtons(): UseActionButtonsReturn {
    const actionsDisabled: Ref<boolean> = ref(false);
    const actionStates: Ref<Record<string, { disabled: boolean; loading: boolean }>> = ref({
        working: { disabled: false, loading: false },
        notWorking: { disabled: false, loading: false },
        skip: { disabled: false, loading: false },
    });

    const disableAllActions = (): void => {
        actionsDisabled.value = true;
        Object.keys(actionStates.value).forEach(key => {
            const actionState = actionStates.value[key];
            if (actionState) {
                actionState.disabled = true;
            }
        });
    };

    const enableAllActions = (): void => {
        actionsDisabled.value = false;
        Object.keys(actionStates.value).forEach(key => {
            const actionState = actionStates.value[key];
            if (actionState) {
                actionState.disabled = false;
            }
        });
    };

    const setActionState = (
        action: string,
        state: Partial<{ disabled: boolean; loading: boolean }>
    ): void => {
        const actionState = actionStates.value[action];
        if (actionState) {
            actionStates.value[action] = {
                disabled: actionState.disabled,
                loading: actionState.loading,
                ...state,
            };
        }
    };

    const setActionLoading = (action: string, loading: boolean = true): void => {
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
export function useTestProgress(totalSteps: number = 1): UseTestProgressReturn {
    const currentStep: Ref<number> = ref(0);
    const completedSteps: Ref<number[]> = ref([]);
    const stepData: Ref<Record<number, unknown>> = ref({});

    const progress: ComputedRef<number> = computed(() => {
        return totalSteps > 0 ? (currentStep.value / totalSteps) * 100 : 0;
    });

    const isComplete: ComputedRef<boolean> = computed(() => {
        return currentStep.value >= totalSteps;
    });

    const nextStep = (data: unknown = {}): void => {
        if (currentStep.value < totalSteps) {
            stepData.value[currentStep.value] = data;
            completedSteps.value.push(currentStep.value);
            currentStep.value += 1;
        }
    };

    const setStep = (step: number, data: unknown = {}): void => {
        if (step >= 0 && step <= totalSteps) {
            currentStep.value = step;
            stepData.value[step] = data;
        }
    };

    const resetProgress = (): void => {
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
