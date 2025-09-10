// Unified base composable for all device testing functionality
import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { useDeviceEnumeration } from '../useDeviceEnumeration.js';
import { useMediaPermissions } from '../useMediaPermissions.js';
import { useMediaStream } from '../useMediaStream.js';
import { useErrorHandling } from '../useErrorHandling.js';
import { useStatePanelConfigs } from '../useStatePanelConfigs.js';
import { useCommonTestPatterns, useTestTimers } from '../useCommonTestPatterns.js';
import type {
    DeviceKind,
    DeviceType,
    PermissionName,
    ComponentState,
    DeviceInfo,
    StatePanelProps,
} from '../../types';

export interface UseBaseDeviceTestOptions {
    deviceKind?: DeviceKind;
    deviceType?: DeviceType;
    permissionType?: PermissionName;
    testName?: string;
    autoInitialize?: boolean;
    enableEventListeners?: boolean;
    enableAnimations?: boolean;
    enableLifecycle?: boolean;
}

export interface DeviceTestState {
    isInitialized: Ref<boolean>;
    currentState: Ref<ComponentState>;
    availableDevices: ComputedRef<DeviceInfo[]>;
    selectedDeviceId: Ref<string>;
    hasDevices: ComputedRef<boolean>;
    isLoading: ComputedRef<boolean>;
    hasPermission: ComputedRef<boolean>;
    needsPermission: ComputedRef<boolean>;
    permissionBlocked: ComputedRef<boolean>;
    hasActiveStream: ComputedRef<boolean>;
    hasError: ComputedRef<boolean>;
    currentError: ComputedRef<string | null>;
    statePanelConfig: ComputedRef<StatePanelProps | null>;
    showTestContent: ComputedRef<boolean>;
    stream: Ref<MediaStream | null>;
}

export interface DeviceTestMethods {
    initializeTest: () => Promise<void>;
    requestPermission: () => Promise<boolean>;
    getDeviceStream: (constraints?: MediaStreamConstraints | null) => Promise<MediaStream | null>;
    switchDevice: (deviceId: string) => Promise<void>;
    completeTest: (additionalData?: Record<string, unknown>) => void;
    failTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    skipTest: (reason?: string, additionalData?: Record<string, unknown>) => void;
    resetTest: () => void;
    cleanup: () => void;
}

/**
 * Unified base composable for all device testing functionality
 * Provides core device testing patterns with extension capabilities
 */
export interface BaseDeviceTestComposables {
    deviceEnumeration: ReturnType<typeof useDeviceEnumeration> | null;
    mediaPermissions: ReturnType<typeof useMediaPermissions> | null;
    mediaStream: ReturnType<typeof useMediaStream>;
    errorHandling: ReturnType<typeof useErrorHandling>;
    statePanelConfigs: ReturnType<typeof useStatePanelConfigs>;
    commonPatterns: ReturnType<typeof useCommonTestPatterns>;
    timers: ReturnType<typeof useTestTimers>;
}

export function useBaseDeviceTest(
    options: UseBaseDeviceTestOptions = {},
    emit?: (event: string, ...args: unknown[]) => void
): DeviceTestState & DeviceTestMethods & BaseDeviceTestComposables {
    const {
        deviceKind,
        deviceType = 'device',
        permissionType,
        testName = 'device',
        autoInitialize = true,
    } = options;

    // Initialize core composables
    const deviceEnumeration = deviceKind ? useDeviceEnumeration(deviceKind, deviceType) : null;
    const mediaPermissions = permissionType
        ? useMediaPermissions(deviceType, permissionType)
        : null;
    const mediaStream = useMediaStream();
    const errorHandling = useErrorHandling(testName);
    const statePanelConfigs = useStatePanelConfigs(deviceType);
    const commonPatterns = useCommonTestPatterns();
    const timers = useTestTimers();

    // State management
    const isInitialized = ref(false);
    const currentState = ref<ComponentState>('initializing');

    // Computed properties
    const availableDevices = computed(() => deviceEnumeration?.availableDevices.value || []);
    const selectedDeviceId = computed({
        get: () => deviceEnumeration?.selectedDeviceId.value || '',
        set: value => deviceEnumeration && (deviceEnumeration.selectedDeviceId.value = value),
    });
    const hasDevices = computed(() => availableDevices.value.length > 0);
    const isLoading = computed(
        () =>
            deviceEnumeration?.loadingDevices.value ||
            mediaPermissions?.checkingPermission.value ||
            currentState.value === 'initializing' ||
            false
    );
    const hasPermission = computed(() => {
        if (!mediaPermissions) return true;
        return mediaPermissions.permissionGranted.value || false;
    });
    const needsPermission = computed(() => {
        if (!mediaPermissions) return false;
        return !hasPermission.value && !mediaPermissions.permissionDenied.value;
    });
    const permissionBlocked = computed(() => {
        if (!mediaPermissions) return false;
        return mediaPermissions.permissionDenied.value || false;
    });
    const hasActiveStream = computed(() => !!mediaStream.stream.value);
    const hasError = computed(() => {
        const hasErrorHandlingError = !!errorHandling.error.value;
        const hasEnumerationError = deviceEnumeration
            ? !!deviceEnumeration.enumerationError?.value
            : false;
        return hasErrorHandlingError || hasEnumerationError;
    });
    const currentError = computed(() => {
        const errorHandlingError = errorHandling.error.value;
        const enumerationError = deviceEnumeration
            ? deviceEnumeration.enumerationError?.value
            : null;
        return errorHandlingError || enumerationError || null;
    });
    const statePanelConfig = computed(() => {
        if (hasError.value) {
            return statePanelConfigs.getErrorConfig(currentError.value);
        }
        if (isLoading.value) {
            return statePanelConfigs.getConfigForDevice('initializing', deviceType);
        }
        if (needsPermission.value) {
            return statePanelConfigs.getConfigForDevice('permissionRequired', deviceType);
        }
        if (permissionBlocked.value) {
            return statePanelConfigs.getConfigForDevice('permissionDenied', deviceType);
        }
        if (!hasDevices.value && deviceEnumeration) {
            return statePanelConfigs.getConfigForDevice('noDevicesFound', deviceType);
        }
        return null;
    });
    const showTestContent = computed(
        () =>
            !hasError.value &&
            !isLoading.value &&
            hasPermission.value &&
            (!deviceEnumeration || hasDevices.value)
    );

    /**
     * Initialize the complete test setup
     */
    const initializeTest = async (): Promise<void> => {
        if (isInitialized.value) return;

        currentState.value = 'initializing';
        errorHandling.clearError();

        try {
            // First, check if devices exist at all (without permissions)
            if (deviceEnumeration) {
                await deviceEnumeration.enumerateDevices();

                if (!hasDevices.value) {
                    // No devices found - skip permission request and show "no devices" state
                    currentState.value = 'no-devices';
                    isInitialized.value = true;
                    return;
                }
            }

            // Devices exist, now check permissions
            if (mediaPermissions) {
                await mediaPermissions.initializePermissions();

                if (!hasPermission.value) {
                    currentState.value = 'permission-required';
                    isInitialized.value = true;
                    return;
                }

                // Permission granted, re-enumerate to get device labels
                if (deviceEnumeration) {
                    await deviceEnumeration.enumerateDevices();
                }
            }

            currentState.value = 'ready';
            isInitialized.value = true;

            // Automatically get device stream after successful initialization
            if (deviceKind && hasPermission.value && hasDevices.value) {
                await getDeviceStream();
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown initialization error';
            errorHandling.setError(`Failed to initialize ${testName}: ${errorMessage}`);
            currentState.value = 'error';

            if (emit) {
                emit('test-failed', testName, { error: errorMessage });
            }
        }
    };

    /**
     * Request permission for the device
     */
    const requestPermission = async (): Promise<boolean> => {
        // If no permissions are required, return success
        if (!mediaPermissions) {
            return true;
        }

        try {
            // Create proper constraints based on device kind
            const constraints =
                deviceKind === 'videoinput'
                    ? { video: true }
                    : deviceKind === 'audioinput'
                      ? { audio: true }
                      : {};

            const streamResult = await mediaPermissions.requestPermission(constraints);

            if (streamResult) {
                // Store the stream in mediaStream composable
                mediaStream.stream.value = streamResult as MediaStream;

                // Re-enumerate devices to get proper labels after permission
                if (deviceEnumeration) {
                    await deviceEnumeration.enumerateDevices();

                    // Check if devices still exist after permission grant
                    if (!hasDevices.value) {
                        errorHandling.setError(
                            `No ${deviceType.toLowerCase()} devices found after permission grant`
                        );
                        return false;
                    }
                }

                return true;
            }

            return false;
        } catch (error) {
            // Handle specific device not found error
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown permission error';

            if (
                errorMessage.includes('device not found') ||
                errorMessage.includes('NotFoundError')
            ) {
                errorHandling.setError(`No ${deviceType.toLowerCase()} device found`);
                currentState.value = 'no-devices';
            } else {
                errorHandling.setError(`Permission request failed: ${errorMessage}`);
            }
            return false;
        }
    };

    /**
     * Get device stream with enhanced error handling
     */
    const getDeviceStream = async (
        constraints: MediaStreamConstraints | null = null
    ): Promise<MediaStream | null> => {
        // Create default constraints if none provided
        if (!constraints) {
            if (deviceKind === 'videoinput') {
                constraints = selectedDeviceId.value
                    ? { video: { deviceId: { exact: selectedDeviceId.value } } }
                    : { video: true };
            } else if (deviceKind === 'audioinput') {
                constraints = selectedDeviceId.value
                    ? { audio: { deviceId: { exact: selectedDeviceId.value } } }
                    : { audio: true };
            } else {
                return null;
            }
        }

        try {
            const stream = await mediaStream.createStream(constraints);

            if (stream) {
                currentState.value = 'streaming';
            }

            return stream;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown stream error';
            errorHandling.setError(`Failed to get device stream: ${errorMessage}`);

            if (emit) {
                emit('test-failed', testName, { error: errorMessage });
            }

            return null;
        }
    };

    /**
     * Switch device with enhanced handling
     */
    const switchDevice = async (deviceId: string): Promise<void> => {
        if (!deviceEnumeration) return;

        try {
            // Stop current stream
            mediaStream.stopStream();

            // Update selected device
            selectedDeviceId.value = deviceId;

            // Get new stream with updated device
            const constraints =
                deviceKind === 'videoinput'
                    ? { video: { deviceId: { exact: deviceId } } }
                    : { audio: { deviceId: { exact: deviceId } } };

            await getDeviceStream(constraints);

            if (emit) {
                emit('device-changed', {
                    deviceId,
                    device: availableDevices.value.find((d: DeviceInfo) => d.deviceId === deviceId),
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown switch error';
            errorHandling.setError(`Failed to switch device: ${errorMessage}`);

            if (emit) {
                emit('device-change-error', error);
            }
        }
    };

    /**
     * Complete test with enhanced result tracking
     */
    const completeTest = (additionalData: Record<string, unknown> = {}): void => {
        commonPatterns.handleTestPass(testName, () => {
            if (emit) {
                emit('test-completed', testName, { status: 'completed', ...additionalData });
            }
        });

        currentState.value = 'completed';
    };

    /**
     * Fail test with enhanced result tracking
     */
    const failTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        commonPatterns.handleTestFail(testName, reason, () => {
            if (emit) {
                emit('test-failed', testName, {
                    status: 'failed',
                    error: reason,
                    ...additionalData,
                });
            }
        });

        currentState.value = 'failed';
    };

    /**
     * Skip test with enhanced result tracking
     */
    const skipTest = (reason: string = '', additionalData: Record<string, unknown> = {}): void => {
        commonPatterns.handleTestSkip(testName, () => {
            if (emit) {
                emit('test-skipped', testName, { status: 'skipped', reason, ...additionalData });
            }
        });

        currentState.value = 'skipped';
    };

    /**
     * Reset test to initial state
     */
    const resetTest = (): void => {
        mediaStream.stopStream();
        if (mediaPermissions) {
            mediaPermissions.resetPermissions();
        }
        errorHandling.clearError();
        timers.clearAllTimers();

        currentState.value = 'initializing';
        isInitialized.value = false;
    };

    /**
     * Enhanced cleanup with all patterns
     */
    const cleanup = (): void => {
        mediaStream.stopStream();
        timers.clearAllTimers();
        errorHandling.clearError();
    };

    // Auto-initialize if requested
    if (autoInitialize) {
        onMounted(initializeTest);
    }

    // Cleanup on unmount
    onUnmounted(cleanup);

    return {
        // State
        isInitialized,
        currentState,
        availableDevices,
        selectedDeviceId,
        hasDevices,
        isLoading,
        hasPermission,
        needsPermission,
        permissionBlocked,
        hasActiveStream,
        hasError,
        currentError,
        statePanelConfig,
        showTestContent,

        // Stream reference
        stream: mediaStream.stream,

        // Methods
        initializeTest,
        requestPermission,
        getDeviceStream,
        switchDevice,
        completeTest,
        failTest,
        skipTest,
        resetTest,
        cleanup,

        // Direct access to composables if needed
        deviceEnumeration,
        mediaPermissions,
        mediaStream,
        errorHandling,
        statePanelConfigs,
        commonPatterns,
        timers,
    };
}
