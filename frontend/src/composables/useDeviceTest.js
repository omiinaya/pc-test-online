// Comprehensive test lifecycle composable with enhanced patterns
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDeviceEnumeration } from './useDeviceEnumeration.js';
import { useMediaPermissions } from './useMediaPermissions.js';
import { useMediaStream } from './useMediaStream.js';
import { useErrorHandling } from './useErrorHandling.js';
import { useStatePanelConfigs } from './useStatePanelConfigs.js';
import { useCommonTestPatterns, useTestTimers } from './useCommonTestPatterns.js';

/**
 * Comprehensive composable that combines all common test patterns
 * This can be used as a base for device test components
 */
export function useDeviceTest(options = {}) {
    const {
        deviceKind = 'videoinput', // 'videoinput', 'audioinput', 'audiooutput'
        deviceType = 'Camera', // Display name like 'Camera', 'Microphone', 'Speaker'
        permissionName = 'camera', // Permission API name
        testName = 'device',
        autoInitialize = true,
    } = options;

    // Initialize all composables
    const deviceEnumeration = useDeviceEnumeration(deviceKind, deviceType);
    const mediaPermissions = useMediaPermissions(deviceType, permissionName);
    const mediaStream = useMediaStream();
    const errorHandling = useErrorHandling(testName);
    const statePanelConfigs = useStatePanelConfigs(deviceType);
    const commonPatterns = useCommonTestPatterns();
    const timers = useTestTimers();

    // Additional state
    const isInitialized = ref(false);
    const currentState = ref('initializing'); // 'initializing', 'ready', 'testing', 'completed', 'error'

    // Computed properties
    const availableDevices = computed(() => deviceEnumeration.availableDevices.value);
    const selectedDeviceId = computed({
        get: () => deviceEnumeration.selectedDeviceId.value,
        set: value => {
            deviceEnumeration.selectedDeviceId.value = value;
        },
    });
    const hasDevices = computed(() => deviceEnumeration.hasDevices.value);
    const isLoading = computed(
        () =>
            deviceEnumeration.loadingDevices.value ||
            mediaPermissions.checkingPermission.value ||
            mediaStream.loading.value ||
            commonPatterns.loading.value
    );
    const hasPermission = computed(() => mediaPermissions.permissionGranted.value);
    const needsPermission = computed(() => mediaPermissions.needsPermission.value);
    const permissionBlocked = computed(() => mediaPermissions.permissionDenied.value);
    const hasActiveStream = computed(() => mediaStream.isActive.value);
    const hasError = computed(
        () =>
            errorHandling.hasError.value ||
            !!deviceEnumeration.enumerationError.value ||
            !!mediaPermissions.permissionError.value ||
            !!mediaStream.error.value
    );

    // Get current error message
    const currentError = computed(() => {
        return (
            errorHandling.error.value ||
            deviceEnumeration.enumerationError.value ||
            mediaPermissions.permissionError.value ||
            mediaStream.error.value
        );
    });

    // Get appropriate StatePanel configuration
    const statePanelConfig = computed(() => {
        if (hasError.value) {
            return statePanelConfigs.getErrorConfig(currentError.value);
        }

        if (isLoading.value) {
            if (deviceEnumeration.loadingDevices.value) {
                return statePanelConfigs.getConfig('detectingDevices');
            } else if (mediaPermissions.checkingPermission.value) {
                return statePanelConfigs.getConfig('checkingPermissions');
            } else {
                return statePanelConfigs.getConfig('initializing');
            }
        }

        if (needsPermission.value) {
            return statePanelConfigs.getConfig('permissionRequired');
        }

        if (permissionBlocked.value) {
            return statePanelConfigs.getConfig('permissionDenied');
        }

        if (!hasDevices.value && !deviceEnumeration.loadingDevices.value) {
            return statePanelConfigs.getConfig('noDevicesFound');
        }

        if (commonPatterns.testCompleted.value) {
            return statePanelConfigs.getConfig('testCompleted');
        }

        if (commonPatterns.skipped.value) {
            return statePanelConfigs.getConfig('testSkipped');
        }

        return null; // No state panel needed - show main content
    });

    // Should show main test content
    const showTestContent = computed(
        () => !statePanelConfig.value && hasDevices.value && hasPermission.value
    );

    /**
     * Initialize the complete test setup
     */
    const initializeTest = async () => {
        try {
            currentState.value = 'initializing';
            errorHandling.clearError();

            // Initialize permissions
            await mediaPermissions.initializePermissions();

            // Enumerate devices
            await deviceEnumeration.enumerateDevices();

            // If we have permission and devices, we're ready
            if (hasPermission.value && hasDevices.value) {
                currentState.value = 'ready';
                isInitialized.value = true;
            }
        } catch (error) {
            console.error(`${testName}: Initialization failed:`, error);
            errorHandling.handleError(error, 'initialization');
            currentState.value = 'error';
        }
    };

    /**
     * Request permission for the device
     */
    const requestPermission = async () => {
        try {
            const constraints =
                deviceKind === 'audiooutput'
                    ? { audio: true } // For speakers, we need audio permission
                    : { [deviceKind === 'videoinput' ? 'video' : 'audio']: true };

            const stream = await mediaPermissions.requestPermission(constraints);

            if (stream) {
                // Store the stream if needed, or clean it up immediately
                stream.getTracks().forEach(track => track.stop());

                // Re-enumerate devices now that we have permission
                await deviceEnumeration.enumerateDevices();

                if (hasDevices.value) {
                    currentState.value = 'ready';
                    isInitialized.value = true;
                }
            }
        } catch (error) {
            console.error(`${testName}: Permission request failed:`, error);
            errorHandling.handleError(error, 'permission request');
        }
    };

    /**
     * Get media stream for the selected device
     */
    const getDeviceStream = async (deviceId = null, additionalConstraints = {}) => {
        try {
            const targetDeviceId = deviceId || selectedDeviceId.value;
            if (!targetDeviceId) {
                throw new Error('No device selected');
            }

            const constraints =
                deviceKind === 'videoinput'
                    ? { video: { deviceId: { exact: targetDeviceId }, ...additionalConstraints } }
                    : { audio: { deviceId: { exact: targetDeviceId }, ...additionalConstraints } };

            return await mediaStream.createStream(constraints);
        } catch (error) {
            console.error(`${testName}: Failed to get device stream:`, error);
            errorHandling.handleError(error, 'getting device stream');
            throw error;
        }
    };

    /**
     * Switch to a different device
     */
    const switchDevice = async newDeviceId => {
        try {
            if (!newDeviceId || newDeviceId === selectedDeviceId.value) {
                return;
            }

            selectedDeviceId.value = newDeviceId;

            // If we have an active stream, restart it with the new device
            if (hasActiveStream.value) {
                await getDeviceStream(newDeviceId);
            }
        } catch (error) {
            console.error(`${testName}: Failed to switch device:`, error);
            errorHandling.handleError(error, 'switching device');
        }
    };

    /**
     * Complete the test
     */
    const completeTest = (result = 'passed') => {
        currentState.value = 'completed';
        if (result === 'passed') {
            commonPatterns.handleTestPass(testName, (_event, _data) => {
                // Emit event if needed
            });
        } else if (result === 'failed') {
            commonPatterns.handleTestFail(testName, 'Test failed', (_event, _data) => {
                // Emit event if needed
            });
        } else if (result === 'skipped') {
            commonPatterns.handleTestSkip(testName, (_event, _data) => {
                // Emit event if needed
            });
        }
    };

    /**
     * Reset the entire test state
     */
    const resetTest = () => {
        mediaStream.stopStream();
        mediaPermissions.resetPermissions();
        commonPatterns.resetTestState();
        errorHandling.clearError();
        timers.clearAllTimers();
        currentState.value = 'initializing';
        isInitialized.value = false;
    };

    /**
     * Cleanup when component unmounts
     */
    const cleanup = () => {
        mediaStream.stopStream();
        timers.clearAllTimers();
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
