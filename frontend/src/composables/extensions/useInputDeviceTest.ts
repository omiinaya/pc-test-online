// Input device extension for keyboard, mouse, and touch testing
import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { useBaseDeviceTest, type UseBaseDeviceTestOptions } from '../base/useBaseDeviceTest.js';
import { useEventListeners } from '../useEventListeners.js';
import { useAnimations } from '../useAnimations.js';
import type { DeviceKind, PermissionName } from '../../types/index.js';

export interface UseInputDeviceTestOptions extends UseBaseDeviceTestOptions {
    enableEventTracking?: boolean;
    enableVisualFeedback?: boolean;
    maxEventHistory?: number;
}

export interface InputEvent {
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
    deviceId?: string | undefined;
}

export type InputDeviceTestEvents = {
    'input-event': [InputEvent];
    'test-started': [string];
    'test-stopped': [string, { eventCount: number }];
    'test-completed': [string, Record<string, unknown>];
    'test-failed': [string, Record<string, unknown>];
    'test-skipped': [string, Record<string, unknown>];
};

/**
 * Input device extension composable for keyboard, mouse, and touch testing
 * Extends the base device test with input-specific functionality
 */
export function useInputDeviceTest(
    options: UseInputDeviceTestOptions = {},
    emit?: <K extends keyof InputDeviceTestEvents>(
        event: K,
        ...args: InputDeviceTestEvents[K]
    ) => void
): InputDeviceTestComposable {
    const {
        enableEventTracking = true,
        enableVisualFeedback = true,
        maxEventHistory = 100,
        ...baseOptions
    } = options;

    // Initialize base composable (input devices typically don't need device enumeration)
    const baseTest = useBaseDeviceTest(
        {
            ...baseOptions,
            deviceKind: undefined as unknown as DeviceKind, // Input devices don't use standard device enumeration
            permissionType: undefined as unknown as PermissionName, // Input devices don't require permissions
        },
        emit as (event: string, ...args: unknown[]) => void // Cast to match base composable signature
    );

    // Input-specific state
    const inputEvents: Ref<InputEvent[]> = ref([]);
    const isTesting: Ref<boolean> = ref(false);
    const lastActivity: Ref<number> = ref(0);
    const eventListeners = enableEventTracking ? useEventListeners() : null;
    const animations = enableVisualFeedback ? useAnimations() : null;

    // Input-specific computed properties
    const eventCount: ComputedRef<number> = computed(() => inputEvents.value.length);
    const recentActivity: ComputedRef<boolean> = computed(() => {
        const now = Date.now();
        return now - lastActivity.value < 2000; // Active if events in last 2 seconds
    });
    const eventSummary: ComputedRef<Record<string, number>> = computed(() => {
        const summary: Record<string, number> = {};
        inputEvents.value.forEach(event => {
            summary[event.type] = (summary[event.type] || 0) + 1;
        });
        return summary;
    });

    /**
     * Record an input event
     */
    const recordInputEvent = (type: string, data: Record<string, unknown>, deviceId?: string): void => {
        const event: InputEvent = {
            type,
            timestamp: Date.now(),
            data,
            deviceId,
        };

        inputEvents.value.push(event);
        lastActivity.value = Date.now();

        // Keep only the most recent events
        if (inputEvents.value.length > maxEventHistory) {
            inputEvents.value = inputEvents.value.slice(-maxEventHistory);
        }

        // Emit event for external consumption
        if (emit) {
            emit('input-event', event);
        }
    };

    /**
     * Start input testing
     */
    const startInputTest = (): void => {
        isTesting.value = true;
        inputEvents.value = [];
        lastActivity.value = Date.now();

        if (emit && baseOptions.testName) {
            emit('test-started', baseOptions.testName);
        }

        // Setup event listeners if enabled
        if (eventListeners && enableEventTracking) {
            setupEventListeners();
        }
    };

    /**
     * Stop input testing
     */
    const stopInputTest = (): void => {
        isTesting.value = false;

        // Cleanup event listeners
        if (eventListeners) {
            eventListeners.cleanupAllListeners();
        }

        if (emit && baseOptions.testName) {
            emit('test-stopped', baseOptions.testName, { eventCount: eventCount.value });
        }
    };

    /**
     * Setup event listeners for input devices
     */
    const setupEventListeners = (): void => {
        if (!eventListeners) return;

        // Keyboard events
        eventListeners.addEventListener(document, 'keydown', (event: KeyboardEvent) => {
            recordInputEvent('keydown', {
                key: event.key,
                code: event.code,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                metaKey: event.metaKey,
            });
        });

        eventListeners.addEventListener(document, 'keyup', (event: KeyboardEvent) => {
            recordInputEvent('keyup', {
                key: event.key,
                code: event.code,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                metaKey: event.metaKey,
            });
        });

        // Mouse events
        eventListeners.addEventListener(document, 'mousedown', (event: MouseEvent) => {
            recordInputEvent('mousedown', {
                button: event.button,
                buttons: event.buttons,
                clientX: event.clientX,
                clientY: event.clientY,
            });
        });

        eventListeners.addEventListener(document, 'mouseup', (event: MouseEvent) => {
            recordInputEvent('mouseup', {
                button: event.button,
                buttons: event.buttons,
                clientX: event.clientX,
                clientY: event.clientY,
            });
        });

        eventListeners.addEventListener(document, 'mousemove', (event: MouseEvent) => {
            recordInputEvent('mousemove', {
                clientX: event.clientX,
                clientY: event.clientY,
                movementX: event.movementX,
                movementY: event.movementY,
            });
        });

        // Touch events
        if (eventListeners) {
            eventListeners.addEventListener(document, 'touchstart', (event: TouchEvent) => {
                recordInputEvent('touchstart', {
                    touches: Array.from(event.touches).map(t => ({
                        identifier: t.identifier,
                        clientX: t.clientX,
                        clientY: t.clientY,
                    })),
                });
            });

            eventListeners.addEventListener(document, 'touchmove', (event: TouchEvent) => {
                recordInputEvent('touchmove', {
                    touches: Array.from(event.touches).map(t => ({
                        identifier: t.identifier,
                        clientX: t.clientX,
                        clientY: t.clientY,
                    })),
                });
            });

            eventListeners.addEventListener(document, 'touchend', (event: TouchEvent) => {
                // Use changedTouches instead of touches for touchend events
                recordInputEvent('touchend', {
                    changedTouches: Array.from(event.changedTouches).map(t => ({
                        identifier: t.identifier,
                        clientX: t.clientX,
                        clientY: t.clientY,
                    })),
                });
            });
        }
    };

    /**
     * Enhanced complete test for input devices
     */
    const completeInputTest = (additionalData: Record<string, unknown> = {}): void => {
        stopInputTest();
        baseTest.completeTest({
            eventCount: eventCount.value,
            eventSummary: eventSummary.value,
            ...additionalData,
        });
    };

    /**
     * Enhanced fail test for input devices
     */
    const failInputTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        stopInputTest();
        baseTest.failTest(reason, {
            eventCount: eventCount.value,
            eventSummary: eventSummary.value,
            ...additionalData,
        });
    };

    /**
     * Enhanced skip test for input devices
     */
    const skipInputTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        stopInputTest();
        baseTest.skipTest(reason, {
            eventCount: eventCount.value,
            eventSummary: eventSummary.value,
            ...additionalData,
        });
    };

    /**
     * Enhanced reset for input devices
     */
    const resetInputTest = (): void => {
        stopInputTest();
        inputEvents.value = [];
        lastActivity.value = 0;
        baseTest.resetTest();
    };

    /**
     * Enhanced cleanup for input devices
     */
    const cleanupInput = (): void => {
        stopInputTest();
        baseTest.cleanup();

        if (animations) {
            animations.cleanupAnimations();
        }
    };

    // Auto-start testing when component becomes active
    onMounted(() => {
        if (options.autoInitialize) {
            startInputTest();
        }
    });

    // Cleanup on unmount - ensure cleanup even if testing is active
    onUnmounted(() => {
        cleanupInput();
        // Additional cleanup to ensure all event listeners are removed
        if (eventListeners) {
            eventListeners.cleanupAllListeners();
        }
        if (animations) {
            animations.cleanupAnimations();
        }
    });

    // Define the composable return type
    const composable: InputDeviceTestComposable = {
        // Base composable functionality
        ...baseTest,

        // Input-specific state
        inputEvents,
        isTesting,
        lastActivity,
        eventCount,
        recentActivity,
        eventSummary,

        // Input-specific methods
        recordInputEvent,
        startInputTest,
        stopInputTest,
        completeInputTest,
        failInputTest,
        skipInputTest,
        resetInputTest,
        cleanupInput,

        // Additional input-specific functionality
        eventListeners,
        animations,
    };

    return composable;
}

// Define the composable return type interface
export interface InputDeviceTestComposable extends ReturnType<typeof useBaseDeviceTest> {
    // Input-specific state
    inputEvents: Ref<InputEvent[]>;
    isTesting: Ref<boolean>;
    lastActivity: Ref<number>;
    eventCount: ComputedRef<number>;
    recentActivity: ComputedRef<boolean>;
    eventSummary: ComputedRef<Record<string, number>>;

    // Input-specific methods
    recordInputEvent: (type: string, data: Record<string, unknown>, deviceId?: string) => void;
    startInputTest: () => void;
    stopInputTest: () => void;
    completeInputTest: (additionalData?: Record<string, unknown>) => void;
    failInputTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    skipInputTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    resetInputTest: () => void;
    cleanupInput: () => void;

    // Additional input-specific functionality
    eventListeners: ReturnType<typeof useEventListeners> | null;
    animations: ReturnType<typeof useAnimations> | null;
}
