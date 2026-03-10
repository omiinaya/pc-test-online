import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, computed } from 'vue';

// Mock MediaStream globally
beforeEach(() => {
    global.MediaStream = class MediaStream {
        private _tracks: any[] = [];
        constructor(tracks?: any[]) {
            this._tracks = tracks || [];
        }
        getTracks() {
            return this._tracks;
        }
        getVideoTracks() {
            return this._tracks.filter((t: any) => t.kind === 'video');
        }
        getAudioTracks() {
            return this._tracks.filter((t: any) => t.kind === 'audio');
        }
    };
});

// Mock dependencies
vi.mock('../../useDeviceEnumeration', () => ({
    useDeviceEnumeration: vi.fn(() => ({
        availableDevices: ref([
            { deviceId: 'test', kind: 'audioinput', label: 'Test Microphone' } as any,
        ]),
        selectedDeviceId: ref('test'),
        loadingDevices: ref(false),
        deviceLoadingStart: ref(null),
        enumerationError: ref(null),
        hasDevices: computed(() => true),
        enumerateDevices: vi.fn(),
        selectDevice: vi.fn(),
        reset: vi.fn(),
        webrtcCompat: {},
    })),
}));

vi.mock('../../useMediaPermissions', () => ({
    useMediaPermissions: vi.fn(() => ({
        permissionGranted: ref(true),
        permissionDenied: ref(false),
        checkingPermission: ref(false),
        initializePermissions: vi.fn().mockImplementation(async () => {}),
        checkPermission: vi.fn(),
        requestPermission: vi.fn().mockResolvedValue(new MediaStream()),
        resetPermissions: vi.fn(),
        checkPermissionsInBackground: vi.fn().mockResolvedValue(null),
        handlePermissionState: vi.fn(),
    })),
}));

vi.mock('../../useMediaStream', () => {
    return {
        useMediaStream: vi.fn(() => {
            const stream = ref(null);
            return {
                stream,
                loading: ref(false),
                error: ref(null),
                createStream: vi.fn().mockImplementation(async () => {
                    const s = new MediaStream();
                    stream.value = s;
                    return s;
                }),
                stopStream: vi.fn().mockImplementation(() => {
                    stream.value = null;
                }),
                switchDevice: vi.fn(),
            };
        }),
    };
});

vi.mock('../../useErrorHandling', () => ({
    useErrorHandling: vi.fn(() => ({
        error: ref(null),
        errorCount: ref(0),
        setError: vi.fn(),
        clearError: vi.fn(),
    })),
}));

vi.mock('../../useStatePanelConfigs', () => ({
    useStatePanelConfigs: vi.fn(() => ({
        config: ref(null),
        getConfig: vi.fn(() => ({ state: 'loading', title: 'Mock', message: 'Mock' })),
        getConfigForDevice: vi.fn(() => ({ state: 'loading', title: 'Mock', message: 'Mock' })),
        getErrorConfig: vi.fn(() => null),
    })),
}));

vi.mock('../../useCommonTestPatterns', () => ({
    useCommonTestPatterns: vi.fn(() => ({
        actionsDisabled: ref(false),
        loading: ref(false),
        error: ref(null),
        skipped: ref(false),
        testCompleted: ref(false),
        handleTestPass: vi.fn(),
        handleTestFail: vi.fn(),
        handleTestSkip: vi.fn(),
        resetTestState: vi.fn(),
    })),
    useTestTimers: vi.fn(() => ({
        skipTimer: ref(null),
        testTimeout: ref(null),
        startSkipTimer: vi.fn(),
        clearSkipTimer: vi.fn(),
        startTestTimeout: vi.fn(),
        clearTestTimeout: vi.fn(),
        clearAllTimers: vi.fn(),
    })),
}));

vi.mock('../../useDeviceDetectionDelay', () => ({
    useDeviceDetectionDelay: vi.fn(() => ({
        shouldShowNoDevices: computed(() => false),
        delayRemaining: computed(() => 0),
        isCountingDown: computed(() => false),
        cancelDelay: vi.fn(),
    })),
}));

import { useMediaDeviceTest } from '../useMediaDeviceTest';

describe('useMediaDeviceTest', () => {
    const defaultOptions = {
        deviceType: 'microphone' as any,
        testName: 'microphone' as any,
        permissionType: 'microphone' as any,
        deviceKind: 'audioinput' as any,
    };

    it('should extend base device test with media-specific features', () => {
        const state = useMediaDeviceTest(defaultOptions);
        expect(state).toBeDefined();
        expect(state.deviceEnumeration).toBeDefined();
        expect(state.mediaPermissions).toBeDefined();
        expect(state.mediaStream).toBeDefined();
        expect(state.errorHandling).toBeDefined();
    });

    describe('deviceDetectionDelay integration', () => {
        it('should provide deviceDetectionDelay when enabled and deviceEnumeration exists', () => {
            const state = useMediaDeviceTest({
                ...defaultOptions,
                enableDeviceDetectionDelay: true,
                detectionDelayMs: 2000,
            });
            expect(state.deviceDetectionDelay).not.toBeNull();
        });

        it('should set deviceDetectionDelay to null when disabled', () => {
            const state = useMediaDeviceTest({
                ...defaultOptions,
                enableDeviceDetectionDelay: false,
            });
            expect(state.deviceDetectionDelay).toBeNull();
        });
    });

    describe('showNoDevicesState', () => {
        it('should return false when deviceDetectionDelay not available and devices exist', () => {
            const state = useMediaDeviceTest(defaultOptions);
            expect(state.showNoDevicesState.value).toBe(false);
        });
    });

    describe('requestPermission', () => {
        it('should request permission and return true on success', async () => {
            const state = useMediaDeviceTest(defaultOptions);
            const result = await state.requestPermission();
            expect(result).toBe(true);
        });

        it('should handle permission denial gracefully', async () => {
            const state = useMediaDeviceTest(defaultOptions);
            // Mock the permission request to throw
            state.mediaPermissions.requestPermission = vi
                .fn()
                .mockRejectedValue(new Error('NotAllowedError'));
            const result = await state.requestPermission();
            expect(result).toBe(false);
        });
    });

    describe('switchDevice', () => {
        it('should return false if no deviceEnumeration', async () => {
            const state = useMediaDeviceTest({
                ...defaultOptions,
                deviceKind: undefined as any, // This causes deviceEnumeration to be null
            });
            const result = await state.switchDevice('some-id');
            expect(result).toBe(false);
        });

        it('should return true when stream is successfully created', async () => {
            const state = useMediaDeviceTest(defaultOptions);
            const result = await state.switchDevice('test-device-id');
            expect(result).toBe(true);
        });
    });
});
