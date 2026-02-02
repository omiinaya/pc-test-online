// Common test utilities and patterns
import { ref, type Ref } from 'vue';
import type { TestType, TestEmitCallback } from '../types';

export interface UseCommonTestPatternsReturn {
  // State
  actionsDisabled: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  skipped: Ref<boolean>;
  testCompleted: Ref<boolean>;

  // Methods
  handleTestPass: (testType: TestType, emitCallback?: TestEmitCallback) => void;
  handleTestFail: (testType: TestType, errorMessage: string, emitCallback?: TestEmitCallback) => void;
  handleTestSkip: (testType: TestType, emitCallback?: TestEmitCallback) => void;
  resetTestState: () => void;
}

export interface UseDeviceChangeHandlerReturn {
  handleDeviceChange: (
    newDeviceId: string,
    currentDeviceId: string | null,
    switchDeviceCallback?: (deviceId: string) => Promise<void>
  ) => Promise<void>;
}

export interface UseTestTimersReturn {
  skipTimer: Ref<NodeJS.Timeout | null>;
  testTimeout: Ref<NodeJS.Timeout | null>;
  startSkipTimer: (callback: (() => void) | null, delay?: number) => void;
  clearSkipTimer: () => void;
  startTestTimeout: (callback: (() => void) | null, delay?: number) => void;
  clearTestTimeout: () => void;
  clearAllTimers: () => void;
}

/**
 * Composable for common test state patterns across different test components
 */
export function useCommonTestPatterns(): UseCommonTestPatternsReturn {
  const actionsDisabled: Ref<boolean> = ref(true);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);
  const skipped: Ref<boolean> = ref(false);
  const testCompleted: Ref<boolean> = ref(false);

  // Common test completion handlers
  const handleTestPass = (testType: TestType, emitCallback?: TestEmitCallback): void => {
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

  const handleTestFail = (testType: TestType, errorMessage: string, emitCallback?: TestEmitCallback): void => {
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

  const handleTestSkip = (testType: TestType, emitCallback?: TestEmitCallback): void => {
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

  const resetTestState = (): void => {
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
export function useDeviceChangeHandler(): UseDeviceChangeHandlerReturn {
  const handleDeviceChange = async (
    newDeviceId: string,
    currentDeviceId: string | null,
    switchDeviceCallback?: (deviceId: string) => Promise<void>
  ): Promise<void> => {
    if (newDeviceId !== currentDeviceId && switchDeviceCallback) {
      try {
        await switchDeviceCallback(newDeviceId);
      } catch (error: unknown) {
        console.error('Failed to switch device:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to switch to selected device: ${errorMessage}`);
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
export function useTestTimers(): UseTestTimersReturn {
  const skipTimer: Ref<NodeJS.Timeout | null> = ref(null);
  const testTimeout: Ref<NodeJS.Timeout | null> = ref(null);

  const startSkipTimer = (callback: (() => void) | null, delay: number = 10000): void => {
    if (skipTimer.value) clearTimeout(skipTimer.value);

    skipTimer.value = setTimeout(() => {
      if (callback) callback();
      skipTimer.value = null;
    }, delay);
  };

  const clearSkipTimer = (): void => {
    if (skipTimer.value) {
      clearTimeout(skipTimer.value);
      skipTimer.value = null;
    }
  };

  const startTestTimeout = (callback: (() => void) | null, delay: number = 30000): void => {
    if (testTimeout.value) clearTimeout(testTimeout.value);

    testTimeout.value = setTimeout(() => {
      if (callback) callback();
      testTimeout.value = null;
    }, delay);
  };

  const clearTestTimeout = (): void => {
    if (testTimeout.value) {
      clearTimeout(testTimeout.value);
      testTimeout.value = null;
    }
  };

  const clearAllTimers = (): void => {
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