// Unified base composable for all device testing functionality
import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { useDeviceEnumeration } from '../useDeviceEnumeration';
import { useMediaPermissions } from '../useMediaPermissions';
import { useMediaStream } from '../useMediaStream';
import { useErrorHandling } from '../useErrorHandling';
import { useStatePanelConfigs } from '../useStatePanelConfigs';
import { useCommonTestPatterns, useTestTimers } from '../useCommonTestPatterns';
import type {
    DeviceKind,
    DeviceType,
    TestType,
    PermissionName,
    ComponentState,
    DeviceInfo,
    StatePanelProps,
} from '../../types';

export interface UseBaseDeviceTestOptions {
    deviceKind?: DeviceKind;
    deviceType?: DeviceType | string;
    permissionType?: PermissionName;
    testName?: TestType | string;
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
        deviceType = 'device' as DeviceType | string,
        permissionType,
        testName = 'device' as TestType | string,
        autoInitialize = true,
    } = options;

    // Initialize core composables
    const deviceEnumeration = deviceKind
        ? useDeviceEnumeration(deviceKind, deviceType as DeviceType)
        : null;
    const mediaPermissions = permissionType
        ? useMediaPermissions(deviceType as DeviceType, permissionType)
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
    const hasActiveStream = computed(() => {
        const hasStream = !!mediaStream.stream.value;
        console.log(
            '[useBaseDeviceTest] hasActiveStream computed:',
            hasStream,
            'stream:',
            mediaStream.stream.value
        );
        return hasStream;
    });
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
    const showTestContent = computed(() => {
        const shouldShow =
            !hasError.value &&
            !isLoading.value &&
            hasPermission.value &&
            (!deviceEnumeration || hasDevices.value);
        console.log('[useBaseDeviceTest] showTestContent computed:', shouldShow, {
            hasError: hasError.value,
            isLoading: isLoading.value,
            hasPermission: hasPermission.value,
            hasDevices: hasDevices.value,
        });
        return shouldShow;
    });

    /**
     * Initialize the complete test setup
     */
    const initializeTest = async (): Promise<void> => {
        console.log('[useBaseDeviceTest] initializeTest() called');
        console.log('[useBaseDeviceTest] isInitialized:', isInitialized.value);

        if (isInitialized.value) {
            console.log('[useBaseDeviceTest] Already initialized, returning');
            return;
        }

        currentState.value = 'initializing';
        errorHandling.clearError();

        try {
            // First, check if devices exist at all (without permissions)
            console.log('[useBaseDeviceTest] Checking if devices exist...');
            if (deviceEnumeration) {
                console.log('[useBaseDeviceTest] Enumerating devices...');
                await deviceEnumeration.enumerateDevices();
                console.log(
                    '[useBaseDeviceTest] Enumeration complete. hasDevices:',
                    hasDevices.value
                );
                console.log(
                    '[useBaseDeviceTest] Available devices:',
                    availableDevices.value.length
                );

                if (!hasDevices.value) {
                    // No devices found - skip permission request and show "no devices" state
                    console.log(
                        '[useBaseDeviceTest] No devices found, setting state to no-devices'
                    );
                    currentState.value = 'no-devices';
                    isInitialized.value = true;
                    return;
                }
            }

            // Devices exist, now check permissions
            console.log('[useBaseDeviceTest] Devices exist, checking permissions...');
            if (mediaPermissions) {
                console.log('[useBaseDeviceTest] Initializing permissions...');
                await mediaPermissions.initializePermissions();
                console.log(
                    '[useBaseDeviceTest] Permission check complete. hasPermission:',
                    hasPermission.value
                );
                console.log('[useBaseDeviceTest] needsPermission:', needsPermission.value);
                console.log('[useBaseDeviceTest] permissionBlocked:', permissionBlocked.value);

                if (!hasPermission.value) {
                    console.log(
                        '[useBaseDeviceTest] Permission not granted, setting state to permission-required'
                    );
                    currentState.value = 'permission-required';
                    isInitialized.value = true;
                    return;
                }

                // Permission granted, re-enumerate to get proper labels
                console.log(
                    '[useBaseDeviceTest] Permission granted, re-enumerating devices for labels...'
                );
                if (deviceEnumeration) {
                    await deviceEnumeration.enumerateDevices();
                    console.log(
                        '[useBaseDeviceTest] Re-enumeration complete. Available devices with labels:',
                        availableDevices.value.length
                    );
                }
            }

            console.log('[useBaseDeviceTest] Setting state to ready');
            currentState.value = 'ready';
            isInitialized.value = true;

            // Automatically get device stream after successful initialization
            console.log('[useBaseDeviceTest] Auto-starting device stream check...');
            console.log('[useBaseDeviceTest] - deviceKind:', deviceKind);
            console.log('[useBaseDeviceTest] - hasPermission:', hasPermission.value);
            console.log('[useBaseDeviceTest] - hasDevices:', hasDevices.value);

            if (deviceKind && hasPermission.value && hasDevices.value) {
                console.log('[useBaseDeviceTest] Auto-starting stream...');
                const stream = await getDeviceStream();
                console.log(
                    '[useBaseDeviceTest] Auto-start complete. hasActiveStream:',
                    hasActiveStream.value
                );

                // Verify the stream has proper resolution
                if (stream) {
                    // Wait a moment for track settings to be populated
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const videoTracks = stream.getVideoTracks();
                    let hasProperResolution = true;
                    videoTracks.forEach((track, i) => {
                        const settings = track.getSettings();
                        console.log(
                            `[useBaseDeviceTest] Auto-start track ${i} resolution: ${settings.width}x${settings.height}`
                        );
                        if (!settings.width || settings.width < 100) {
                            console.log(
                                `[useBaseDeviceTest] Track ${i} has bad resolution, will recreate with force`
                            );
                            hasProperResolution = false;
                        }
                    });

                    if (!hasProperResolution) {
                        console.log(
                            '[useBaseDeviceTest] Recreating stream with force flag to get proper resolution'
                        );
                        // Clear the stream first so the watcher triggers properly
                        mediaStream.stream.value = null;
                        await getDeviceStream(null, true);
                    }
                }
            } else {
                console.log('[useBaseDeviceTest] Not auto-starting - conditions not met');
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown initialization error';
            console.error('[useBaseDeviceTest] Initialization error:', errorMessage);
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
        console.log('[useBaseDeviceTest] requestPermission() called');
        // If no permissions are required, return success
        if (!mediaPermissions) {
            console.log('[useBaseDeviceTest] No mediaPermissions required, returning true');
            return true;
        }

        try {
            // Create proper constraints based on device kind with minimum resolution
            const constraints =
                deviceKind === 'videoinput'
                    ? {
                          video: {
                              width: { min: 320, ideal: 1280 },
                              height: { min: 240, ideal: 720 },
                          },
                      }
                    : deviceKind === 'audioinput'
                      ? { audio: true }
                      : {};
            console.log('[useBaseDeviceTest] Requesting permission with constraints:', constraints);

            const streamResult = await mediaPermissions.requestPermission(constraints);
            console.log('[useBaseDeviceTest] Permission request result:', !!streamResult);

            if (streamResult) {
                // Log track details immediately
                const videoTracks = streamResult.getVideoTracks();
                console.log(
                    '[useBaseDeviceTest] Got stream with',
                    videoTracks.length,
                    'video tracks'
                );
                videoTracks.forEach((track, i) => {
                    const settings = track.getSettings();
                    console.log(`[useBaseDeviceTest] Track ${i} settings:`, settings);
                    console.log(
                        `[useBaseDeviceTest] Track ${i} resolution: ${settings.width}x${settings.height}`
                    );
                });

                // Store the stream in mediaStream composable
                console.log('[useBaseDeviceTest] Storing stream in mediaStream');
                mediaStream.stream.value = streamResult as MediaStream;

                // Re-enumerate devices to get proper labels after permission
                if (deviceEnumeration) {
                    console.log(
                        '[useBaseDeviceTest] Re-enumerating devices after permission grant...'
                    );
                    await deviceEnumeration.enumerateDevices();
                    console.log(
                        '[useBaseDeviceTest] Re-enumeration complete. hasDevices:',
                        hasDevices.value
                    );

                    // Check if devices still exist after permission grant
                    if (!hasDevices.value) {
                        console.log('[useBaseDeviceTest] No devices found after permission grant');
                        errorHandling.setError(
                            `No ${deviceType.toLowerCase()} devices found after permission grant`
                        );
                        return false;
                    }
                }

                console.log('[useBaseDeviceTest] Permission granted successfully');
                return true;
            }

            console.log('[useBaseDeviceTest] Permission request returned no stream');
            return false;
        } catch (error) {
            // Handle specific device not found error
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown permission error';
            console.error('[useBaseDeviceTest] Permission request error:', errorMessage);

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
        constraints: MediaStreamConstraints | null = null,
        forceRecreate: boolean = false
    ): Promise<MediaStream | null> => {
        console.log('[useBaseDeviceTest] getDeviceStream() called, forceRecreate:', forceRecreate);

        // Create default constraints if none provided
        if (!constraints) {
            if (deviceKind === 'videoinput') {
                const baseConstraints = selectedDeviceId.value
                    ? { deviceId: { exact: selectedDeviceId.value } }
                    : {};
                constraints = {
                    video: {
                        ...baseConstraints,
                        width: { min: 320, ideal: 1280 },
                        height: { min: 240, ideal: 720 },
                    },
                };
            } else if (deviceKind === 'audioinput') {
                constraints = selectedDeviceId.value
                    ? { audio: { deviceId: { exact: selectedDeviceId.value } } }
                    : { audio: true };
            } else {
                return null;
            }
        }

        console.log('[useBaseDeviceTest] Using constraints:', constraints);

        // If force recreate, stop existing stream first
        if (forceRecreate && mediaStream.stream.value) {
            console.log(
                '[useBaseDeviceTest] Force recreating stream - stopping existing stream completely'
            );
            // Stop all tracks explicitly
            mediaStream.stream.value.getTracks().forEach(track => {
                console.log('[useBaseDeviceTest] Stopping track:', track.label);
                track.stop();
            });
            mediaStream.stream.value = null;
            console.log('[useBaseDeviceTest] Stream set to null, will create fresh stream');
        }

        try {
            // Check if we already have a valid stream with same constraints
            if (!forceRecreate && mediaStream.stream.value) {
                const existingTracks = mediaStream.stream.value.getTracks();
                const hasVideo =
                    deviceKind === 'videoinput'
                        ? existingTracks.some(
                              t => t.kind === 'video' && !t.muted && t.readyState === 'live'
                          )
                        : true;
                const hasAudio =
                    deviceKind === 'audioinput'
                        ? existingTracks.some(
                              t => t.kind === 'audio' && !t.muted && t.readyState === 'live'
                          )
                        : true;

                if (hasVideo && hasAudio) {
                    // Also check resolution for video streams
                    if (deviceKind === 'videoinput') {
                        const videoTrack = existingTracks.find(t => t.kind === 'video');
                        if (videoTrack) {
                            const settings = videoTrack.getSettings();
                            console.log(
                                `[useBaseDeviceTest] Existing stream resolution: ${settings.width}x${settings.height}`
                            );
                            if (!settings.width || settings.width < 100) {
                                console.log(
                                    '[useBaseDeviceTest] Existing stream has bad resolution, will create new stream'
                                );
                                // Don't reuse, continue to create new stream
                            } else {
                                console.log(
                                    '[useBaseDeviceTest] Reusing existing stream with good resolution'
                                );
                                currentState.value = 'streaming';
                                return mediaStream.stream.value;
                            }
                        }
                    } else {
                        console.log('[useBaseDeviceTest] Reusing existing stream');
                        currentState.value = 'streaming';
                        return mediaStream.stream.value;
                    }
                }
                console.log(
                    '[useBaseDeviceTest] Existing stream has muted or ended tracks, creating new stream'
                );
            }

            console.log('[useBaseDeviceTest] Creating new stream');
            const stream = await mediaStream.createStream(constraints);

            if (stream) {
                // Log the actual resolution we got
                const videoTracks = stream.getVideoTracks();
                videoTracks.forEach((track, i) => {
                    const settings = track.getSettings();
                    console.log(
                        `[useBaseDeviceTest] New stream track ${i} resolution: ${settings.width}x${settings.height}`
                    );
                });

                currentState.value = 'streaming';
                console.log('[useBaseDeviceTest] Stream created, state set to streaming');
            }

            return stream;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown stream error';
            console.error('[useBaseDeviceTest] Error getting stream:', errorMessage);
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

            // Get new stream with updated device and minimum resolution
            const constraints =
                deviceKind === 'videoinput'
                    ? {
                          video: {
                              deviceId: { exact: deviceId },
                              width: { min: 320, ideal: 1280 },
                              height: { min: 240, ideal: 720 },
                          },
                      }
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
        commonPatterns.handleTestPass(testName as TestType, () => {
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
        commonPatterns.handleTestFail(testName as TestType, reason, () => {
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
        commonPatterns.handleTestSkip(testName as TestType, () => {
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
        console.log('[useBaseDeviceTest] resetTest() called');
        // Stop the stream first
        mediaStream.stopStream();
        if (mediaPermissions) {
            mediaPermissions.resetPermissions();
        }
        errorHandling.clearError();
        timers.clearAllTimers();

        currentState.value = 'initializing';
        isInitialized.value = false;
        console.log('[useBaseDeviceTest] Test reset complete');
    };

    /**
     * Enhanced cleanup with all patterns
     */
    const cleanup = (): void => {
        console.log('[useBaseDeviceTest] cleanup() called');
        mediaStream.stopStream();
        timers.clearAllTimers();
        errorHandling.clearError();
        console.log('[useBaseDeviceTest] Cleanup complete');
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
