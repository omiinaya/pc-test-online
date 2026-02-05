// Media device extension for camera, microphone, and speaker testing
import { computed, watch } from 'vue';
import { useBaseDeviceTest, type UseBaseDeviceTestOptions } from '../base/useBaseDeviceTest';
import { useDeviceDetectionDelay } from '../useDeviceDetectionDelay';

export interface UseMediaDeviceTestOptions extends UseBaseDeviceTestOptions {
    enableDeviceDetectionDelay?: boolean;
    detectionDelayMs?: number;
}

/**
 * Media device extension composable for camera and microphone testing
 * Extends the base device test with media-specific functionality
 */
export function useMediaDeviceTest(
    options: UseMediaDeviceTestOptions = {},
    emit?: (event: string, ...args: unknown[]) => void
) {
    const { enableDeviceDetectionDelay = true, detectionDelayMs = 2000, ...baseOptions } = options;

    // Initialize base composable
    const baseTest = useBaseDeviceTest(baseOptions, emit);

    // Device detection delay for better UX
    const deviceDetectionDelay =
        baseTest.deviceEnumeration && enableDeviceDetectionDelay
            ? useDeviceDetectionDelay(baseTest.deviceEnumeration, detectionDelayMs)
            : null;

    // Enhanced computed properties for media devices
    const showNoDevicesState = computed(() => {
        if (!deviceDetectionDelay) return !baseTest.hasDevices.value;
        return deviceDetectionDelay.shouldShowNoDevices.value;
    });

    // Enhanced permission request for media devices
    const requestMediaPermission = async (): Promise<boolean> => {
        if (!baseTest.mediaPermissions) {
            return true;
        }

        try {
            const constraints =
                baseOptions.deviceKind === 'videoinput'
                    ? { video: true }
                    : baseOptions.deviceKind === 'audioinput'
                      ? { audio: true }
                      : {};

            const stream = await baseTest.mediaPermissions.requestPermission(constraints);

            if (stream) {
                // Store the stream
                baseTest.mediaStream.stream.value = stream;

                // Re-enumerate devices to get proper labels
                if (baseTest.deviceEnumeration) {
                    await baseTest.deviceEnumeration.enumerateDevices();

                    if (!baseTest.hasDevices.value) {
                        baseTest.errorHandling.setError(
                            `No ${baseOptions.deviceType?.toLowerCase() || 'device'} devices found after permission grant`
                        );
                        return false;
                    }
                }

                return true;
            }

            return false;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown permission error';

            if (
                errorMessage.includes('device not found') ||
                errorMessage.includes('NotFoundError')
            ) {
                baseTest.errorHandling.setError(
                    `No ${baseOptions.deviceType?.toLowerCase() || 'device'} device found`
                );
                baseTest.currentState.value = 'no-devices';
            } else {
                baseTest.errorHandling.setError(`Permission request failed: ${errorMessage}`);
            }
            return false;
        }
    };

    // Enhanced device switching for media devices
    const switchMediaDevice = async (deviceId: string): Promise<boolean> => {
        if (!baseTest.deviceEnumeration) return false;

        try {
            // Stop current stream
            baseTest.mediaStream.stopStream();

            // Update selected device
            baseTest.selectedDeviceId.value = deviceId;

            // Get new stream with updated device
            const constraints =
                baseOptions.deviceKind === 'videoinput'
                    ? { video: { deviceId: { exact: deviceId } } }
                    : { audio: { deviceId: { exact: deviceId } } };

            const stream = await baseTest.getDeviceStream(constraints);

            if (stream) {
                if (emit) {
                    const device = baseTest.availableDevices.value.find(
                        d => d.deviceId === deviceId
                    );
                    emit('device-changed', { deviceId, device });
                }
                return true;
            }

            return false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown switch error';
            baseTest.errorHandling.setError(`Failed to switch device: ${errorMessage}`);

            if (emit) {
                emit('device-change-error', error);
            }
            return false;
        }
    };

    // Enhanced initialization for media devices
    const initializeMediaTest = async (): Promise<void> => {
        console.log('[useMediaDeviceTest] initializeMediaTest() called');
        console.log('[useMediaDeviceTest] isInitialized:', baseTest.isInitialized.value);

        if (baseTest.isInitialized.value) {
            console.log('[useMediaDeviceTest] Already initialized, skipping');
            return;
        }

        baseTest.currentState.value = 'initializing';
        baseTest.errorHandling.clearError();

        try {
            // First, check if devices exist at all
            console.log('[useMediaDeviceTest] Checking if devices exist...');
            if (baseTest.deviceEnumeration) {
                console.log('[useMediaDeviceTest] Enumerating devices...');
                await baseTest.deviceEnumeration.enumerateDevices();
                console.log('[useMediaDeviceTest] Devices found:', baseTest.hasDevices.value);
                console.log(
                    '[useMediaDeviceTest] Available devices count:',
                    baseTest.availableDevices.value.length
                );

                if (!baseTest.hasDevices.value) {
                    // No devices found
                    console.log(
                        '[useMediaDeviceTest] No devices found, setting state to no-devices'
                    );
                    baseTest.currentState.value = 'no-devices';
                    baseTest.isInitialized.value = true;
                    return;
                }
            }

            // Devices exist, now check permissions
            console.log('[useMediaDeviceTest] Checking permissions...');
            if (baseTest.mediaPermissions) {
                console.log('[useMediaDeviceTest] Initializing permissions...');
                await baseTest.mediaPermissions.initializePermissions();
                console.log(
                    '[useMediaDeviceTest] Permission check complete. hasPermission:',
                    baseTest.hasPermission.value
                );

                if (!baseTest.hasPermission.value) {
                    console.log(
                        '[useMediaDeviceTest] Permission not granted, setting state to permission-required'
                    );
                    baseTest.currentState.value = 'permission-required';
                    baseTest.isInitialized.value = true;
                    return;
                }

                // Permission granted, re-enumerate to get proper labels
                console.log(
                    '[useMediaDeviceTest] Permission granted, re-enumerating devices for labels...'
                );
                if (baseTest.deviceEnumeration) {
                    await baseTest.deviceEnumeration.enumerateDevices();
                    console.log(
                        '[useMediaDeviceTest] Re-enumeration complete. Available devices:',
                        baseTest.availableDevices.value.length
                    );
                }
            }

            console.log('[useMediaDeviceTest] Setting state to ready');
            baseTest.currentState.value = 'ready';
            baseTest.isInitialized.value = true;

            // Automatically get device stream after successful initialization
            console.log('[useMediaDeviceTest] Checking if should auto-start stream...');
            console.log('[useMediaDeviceTest] - deviceKind:', baseOptions.deviceKind);
            console.log('[useMediaDeviceTest] - hasPermission:', baseTest.hasPermission.value);
            console.log('[useMediaDeviceTest] - hasDevices:', baseTest.hasDevices.value);

            if (
                baseOptions.deviceKind &&
                baseTest.hasPermission.value &&
                baseTest.hasDevices.value
            ) {
                console.log('[useMediaDeviceTest] Auto-starting device stream...');
                await baseTest.getDeviceStream();
                console.log(
                    '[useMediaDeviceTest] Auto-start complete. hasActiveStream:',
                    baseTest.hasActiveStream.value
                );
            } else {
                console.log('[useMediaDeviceTest] Not auto-starting stream - conditions not met');
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown initialization error';
            console.error('[useMediaDeviceTest] Initialization error:', errorMessage);
            baseTest.errorHandling.setError(
                `Failed to initialize ${baseOptions.testName}: ${errorMessage}`
            );
            baseTest.currentState.value = 'error';

            if (emit) {
                emit('test-failed', baseOptions.testName, { error: errorMessage });
            }
        }
    };

    // Watch for permission changes to continue initialization
    if (baseTest.mediaPermissions) {
        watch(
            () => baseTest.hasPermission.value,
            async newHasPermission => {
                if (newHasPermission && baseTest.currentState.value === 'permission-required') {
                    // Continue with device enumeration to get proper labels
                    if (baseTest.deviceEnumeration) {
                        try {
                            await baseTest.deviceEnumeration.enumerateDevices();

                            if (!baseTest.hasDevices.value) {
                                baseTest.currentState.value = 'no-devices';
                                return;
                            }
                        } catch (error) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : 'Device enumeration failed';
                            baseTest.errorHandling.setError(
                                `Device enumeration failed: ${errorMessage}`
                            );
                            baseTest.currentState.value = 'error';
                            return;
                        }
                    }

                    baseTest.currentState.value = 'ready';

                    // Automatically get device stream after permission is granted
                    if (baseOptions.deviceKind && baseTest.hasDevices.value) {
                        await baseTest.getDeviceStream();
                    }
                }
            },
            { immediate: false }
        );
    }

    return {
        // Base composable functionality
        ...baseTest,

        // Enhanced state
        showNoDevicesState,

        // Enhanced methods
        requestPermission: requestMediaPermission,
        switchDevice: switchMediaDevice,
        initializeTest: initializeMediaTest,

        // Additional media-specific functionality
        deviceDetectionDelay,
    };
}
