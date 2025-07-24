// Enhanced comprehensive test lifecycle composable with all new patterns
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDeviceEnumeration } from './useDeviceEnumeration.js';
import { useDeviceDetectionDelay } from './useDeviceDetectionDelay.js';
import { useMediaPermissions } from './useMediaPermissions.js';
import { useMediaStream } from './useMediaStream.js';
import { useErrorHandling } from './useErrorHandling.js';
import { useStatePanelConfigs } from './useStatePanelConfigs.js';
import { useCommonTestPatterns, useTestTimers } from './useCommonTestPatterns.js';
import { useComponentLifecycle } from './useComponentLifecycle.js';
import { useEventListeners } from './useEventListeners.js';
import { useTestResults } from './useTestResults.js';
import { useAnimations } from './useAnimations.js';

/**
 * Enhanced comprehensive composable that combines ALL normalized test patterns
 * This provides a complete foundation for device test components with:
 * - Lifecycle management (mount, unmount, activate, deactivate)
 * - Event listener management with automatic cleanup
 * - Test result tracking and standardized emits
 * - Animation and transition control
 * - Error handling and state management
 * - Device enumeration and permissions
 * - Media stream management
 *
 * This supersedes the original useDeviceTest with enhanced patterns.
 */
export function useEnhancedDeviceTest(options = {}, emit = null) {
    const {
        deviceKind = null,
        deviceType = 'device',
        permissionType = null,
        testName = 'test',
        autoInitialize = true,
        enableEventListeners = true,
        enableAnimations = true,
        enableLifecycle = true,
    } = options;

    // Core composables (existing patterns)
    const deviceEnumeration = deviceKind ? useDeviceEnumeration(deviceKind, deviceType) : null;
    const deviceDetectionDelay = deviceEnumeration
        ? useDeviceDetectionDelay(deviceEnumeration, 2000)
        : null;
    const mediaPermissions = permissionType ? useMediaPermissions(testName, permissionType) : null;
    const mediaStream = useMediaStream();
    const errorHandling = useErrorHandling();
    const statePanelConfigs = useStatePanelConfigs();
    const commonPatterns = useCommonTestPatterns();
    const timers = useTestTimers();

    // Enhanced composables (new normalized patterns)
    const lifecycle = enableLifecycle ? useComponentLifecycle({ autoInitialize: false }) : null;
    const eventListeners = enableEventListeners ? useEventListeners() : null;
    const testResults = emit ? useTestResults(testName, emit) : null;
    const animations = enableAnimations ? useAnimations() : null;

    // State management
    const isInitialized = ref(false);
    const currentState = ref('initializing');

    // Computed properties
    const availableDevices = computed(() => deviceEnumeration?.availableDevices.value || []);
    const selectedDeviceId = computed({
        get: () => deviceEnumeration?.selectedDeviceId.value || '',
        set: value => deviceEnumeration && (deviceEnumeration.selectedDeviceId.value = value),
    });
    const hasDevices = computed(() => availableDevices.value.length > 0);

    // Device detection with delay - only show "no devices" after 2 seconds
    const showNoDevicesState = computed(() => {
        if (!deviceDetectionDelay) return !hasDevices.value;
        return deviceDetectionDelay.shouldShowNoDevices.value;
    });
    const isLoading = computed(() => {
        const loading =
            deviceEnumeration?.loadingDevices.value ||
            mediaPermissions?.checkingPermission.value ||
            currentState.value === 'initializing' ||
            false;
        return loading;
    });

    // Permission state
    const hasPermission = computed(() => {
        // If no permission is required (e.g., for audio output), always return true
        if (!mediaPermissions) return true;
        return mediaPermissions.permissionGranted.value || false;
    });
    const needsPermission = computed(() => {
        // If no permission is required, never need permission
        if (!mediaPermissions) return false;
        return !hasPermission.value && !mediaPermissions.permissionDenied.value;
    });
    const permissionBlocked = computed(() => {
        // If no permission is required, never blocked
        if (!mediaPermissions) return false;
        return mediaPermissions.permissionDenied.value || false;
    });

    // Stream state
    const hasActiveStream = computed(() => !!mediaStream.stream.value);

    // Error state
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

    // State panel configuration
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

    // Show test content when everything is ready
    const showTestContent = computed(
        () =>
            !hasError.value &&
            !isLoading.value &&
            hasPermission.value &&
            (!deviceEnumeration || hasDevices.value)
    );

    /**
     * Initialize the test with enhanced lifecycle
     */
    const initializeTest = async () => {
        if (isInitialized.value) return;

        currentState.value = 'initializing';

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
            errorHandling.setError(`Failed to initialize ${testName}: ${error.message}`);
            currentState.value = 'error';

            if (testResults) {
                testResults.failTest(error.message);
            }
        }
    };

    // Watcher to continue initialization when permissions are granted
    if (mediaPermissions) {
        watch(
            () => hasPermission.value,
            async newHasPermission => {
                if (newHasPermission && currentState.value === 'permission-required') {
                    // Continue with device enumeration to get proper labels
                    if (deviceEnumeration) {
                        try {
                            await deviceEnumeration.enumerateDevices();

                            if (!hasDevices.value) {
                                currentState.value = 'no-devices';
                                return;
                            }
                        } catch (error) {
                            errorHandling.setError(`Device enumeration failed: ${error.message}`);
                            currentState.value = 'error';
                            return;
                        }
                    }

                    currentState.value = 'ready';

                    // Automatically get device stream after permission is granted
                    if (deviceKind && hasDevices.value) {
                        await getDeviceStream();
                    }
                }
            },
            { immediate: false }
        );
    }

    /**
     * Request permission with enhanced error handling
     */
    const requestPermission = async () => {
        // If no permissions are required (e.g., for audio output), return success
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

            const stream = await mediaPermissions.requestPermission(constraints);

            if (stream) {
                // Store the stream in mediaStream composable
                mediaStream.stream.value = stream;

                // Re-enumerate devices to get proper labels after permission
                if (deviceEnumeration) {
                    await deviceEnumeration.enumerateDevices();

                    // Check if devices still exist after permission grant
                    if (!hasDevices.value) {
                        // This shouldn't happen, but handle it gracefully
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
            if (
                error.message.includes('device not found') ||
                error.message.includes('NotFoundError')
            ) {
                errorHandling.setError(`No ${deviceType.toLowerCase()} device found`);
                currentState.value = 'no-devices';
            } else {
                errorHandling.setError(`Permission request failed: ${error.message}`);
            }
            return false;
        }
    };

    /**
     * Get device stream with enhanced error handling
     */
    const getDeviceStream = async (constraints = null) => {
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
            errorHandling.setError(`Failed to get device stream: ${error.message}`);

            if (testResults) {
                testResults.failTest(error.message);
            }

            return null;
        }
    };

    /**
     * Switch device with enhanced handling
     */
    const switchDevice = async deviceId => {
        if (!deviceEnumeration) return false;

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

            return await getDeviceStream(constraints);
        } catch (error) {
            errorHandling.setError(`Failed to switch device: ${error.message}`);
            return false;
        }
    };

    /**
     * Complete test with enhanced result tracking
     */
    const completeTest = (additionalData = {}) => {
        if (testResults) {
            testResults.completeTest(additionalData);
        } else {
            commonPatterns.handleTestPass(testName, () => {});
        }

        currentState.value = 'completed';
    };

    /**
     * Fail test with enhanced result tracking
     */
    const failTest = (reason = '', additionalData = {}) => {
        if (testResults) {
            testResults.failTest(reason, additionalData);
        } else {
            commonPatterns.handleTestFail(testName, reason, () => {});
        }

        currentState.value = 'failed';
    };

    /**
     * Skip test with enhanced result tracking
     */
    const skipTest = (reason = '', additionalData = {}) => {
        if (testResults) {
            testResults.skipTest(reason, additionalData);
        } else {
            commonPatterns.handleTestSkip(testName, () => {});
        }

        currentState.value = 'skipped';
    };

    /**
     * Reset test to initial state
     */
    const resetTest = () => {
        mediaStream.stopStream();
        if (mediaPermissions) {
            mediaPermissions.resetPermissions();
        }
        if (deviceDetectionDelay) {
            deviceDetectionDelay.resetDetection();
        }
        errorHandling.clearError();
        timers.clearAllTimers();

        if (testResults) {
            testResults.resetTest();
        }

        if (animations) {
            animations.cleanupAnimations();
        }

        currentState.value = 'initializing';
        isInitialized.value = false;
    };

    /**
     * Enhanced cleanup with all patterns
     */
    const cleanup = () => {
        mediaStream.stopStream();
        timers.clearAllTimers();

        if (deviceDetectionDelay) {
            deviceDetectionDelay.resetDetection();
        }

        if (animations) {
            animations.cleanupAnimations();
        }

        // Event listeners are auto-cleaned by useEventListeners
    };

    // Setup lifecycle callbacks if enabled
    if (lifecycle) {
        lifecycle.onInitialize(initializeTest);
        lifecycle.onCleanup(cleanup);
    }

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
        showNoDevicesState,
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

        // Enhanced features
        lifecycle,
        eventListeners,
        testResults,
        animations,

        // Direct access to composables if needed
        deviceEnumeration,
        deviceDetectionDelay,
        mediaPermissions,
        mediaStream,
        errorHandling,
        statePanelConfigs,
        commonPatterns,
        timers,
    };
}

/**
 * Legacy compatibility - exports the original useDeviceTest
 * @deprecated Use useEnhancedDeviceTest instead
 */
export { useDeviceTest } from './useDeviceTest.js';
