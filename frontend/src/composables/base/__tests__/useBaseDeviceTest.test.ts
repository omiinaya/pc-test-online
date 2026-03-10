import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, computed } from 'vue';

// Enhanced MediaStream mock with necessary methods
beforeEach(() => {
    // Mock MediaStream globally
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
    // Mock MediaStreamTrack if needed
    global.MediaStreamTrack = class MediaStreamTrack {
        kind: string;
        label: string;
        readyState: string = 'live';
        constructor(kind: string = 'audio') {
            this.kind = kind;
            this.label = 'Mock Track';
        }
        stop() {}
        getSettings() {
            return { width: 1280, height: 720, deviceId: 'mock' };
        }
    };
});

// Mock dependencies (note: relative paths go up two levels from base/__tests__ to composables/)
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
        initializePermissions: vi.fn().mockImplementation(async () => {
            // Already granted, nothing to do
        }),
        checkPermission: vi.fn(),
        requestPermission: vi.fn().mockResolvedValue(new MediaStream()),
        resetPermissions: vi.fn(),
        checkPermissionsInBackground: vi.fn().mockResolvedValue(null),
        handlePermissionState: vi.fn(),
    })),
}));

vi.mock('../../useMediaStream', () => {
    // We need to create a mock that maintains state per instance
    return {
        useMediaStream: vi.fn(() => {
            const stream = ref(null);
            return {
                stream,
                loading: ref(false),
                error: ref(null),
                createStream: vi.fn().mockImplementation(async constraints => {
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

import { useBaseDeviceTest } from '../useBaseDeviceTest';

describe('useBaseDeviceTest', () => {
    const defaultOptions = {
        deviceType: 'microphone' as any,
        testName: 'microphone' as any,
        permissionType: 'microphone' as any,
        deviceKind: 'audioinput' as any,
    };

    it('should initialize with correct default state', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.isInitialized.value).toBe(false);
        expect(state.currentState.value).toBe('initializing');
        expect(state.selectedDeviceId.value).toBe('test');
        expect(state.stream.value).toBeNull();
    });

    it('should have computed hasDevices based on availableDevices', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.hasDevices.value).toBe(true);
    });

    it('should have isLoading reflect enumeration and permission states', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.isLoading.value).toBe(true);
    });

    it('should have hasPermission from mediaPermissions', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.hasPermission.value).toBe(true);
    });

    it('should have needsPermission false when permission granted', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.needsPermission.value).toBe(false);
    });

    it('should have permissionBlocked false initially', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.permissionBlocked.value).toBe(false);
    });

    it('should have hasActiveStream false initially', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.hasActiveStream.value).toBe(false);
    });

    it('should have hasError false initially', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.hasError.value).toBe(false);
    });

    it('should have currentError as null initially', () => {
        const state = useBaseDeviceTest(defaultOptions);
        expect(state.currentError.value).toBeNull();
    });

    it('should expose all composite dependencies', () => {
        const result = useBaseDeviceTest(defaultOptions);
        expect(result.deviceEnumeration).toBeDefined();
        expect(result.mediaPermissions).toBeDefined();
        expect(result.mediaStream).toBeDefined();
        expect(result.errorHandling).toBeDefined();
        expect(result.statePanelConfigs).toBeDefined();
        expect(result.commonPatterns).toBeDefined();
        expect(result.timers).toBeDefined();
    });

    describe('initializeTest', () => {
        it('should set isInitialized to true', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            await state.initializeTest();
            expect(state.isInitialized.value).toBe(true);
        });

        it('should set currentState to streaming after successful auto-start', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            await state.initializeTest();
            // After successful initialization with auto-start, state becomes streaming
            expect(state.currentState.value).toBe('streaming');
        });
    });

    describe('requestPermission', () => {
        it('should return a boolean', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const result = await state.requestPermission();
            expect(typeof result).toBe('boolean');
            expect(result).toBe(true);
        });
    });

    describe('getDeviceStream', () => {
        it('should return a MediaStream or null', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const result = await state.getDeviceStream();
            expect(result === null || result instanceof MediaStream).toBe(true);
            expect(result).toBeInstanceOf(MediaStream);
        });
    });

    describe('switchDevice', () => {
        it('should be a function', () => {
            const state = useBaseDeviceTest(defaultOptions);
            expect(typeof state.switchDevice).toBe('function');
        });
    });

    describe('completeTest', () => {
        it('should call commonPatterns.handleTestPass', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const handleTestPassSpy = vi.spyOn(state.commonPatterns, 'handleTestPass');
            await state.completeTest({ score: 100 });
            expect(handleTestPassSpy).toHaveBeenCalled();
        });
    });

    describe('failTest', () => {
        it('should call commonPatterns.handleTestFail', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const handleTestFailSpy = vi.spyOn(state.commonPatterns, 'handleTestFail');
            await state.failTest('Test failure');
            expect(handleTestFailSpy).toHaveBeenCalled();
        });
    });

    describe('skipTest', () => {
        it('should set currentState to skipped', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            await state.skipTest('Not supported');
            expect(state.currentState.value).toBe('skipped');
        });
    });

    describe('resetTest', () => {
        it('should reset state to initial values', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            await state.initializeTest();
            state.currentState.value = 'testing';
            state.stream.value = new MediaStream();
            await state.resetTest();

            expect(state.currentState.value).toBe('initializing');
            expect(state.stream.value).toBeNull();
        });
    });

    describe('cleanup', () => {
        it('should call mediaStream.stopStream', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const stopStreamSpy = vi.spyOn(state.mediaStream, 'stopStream');
            await state.cleanup();
            expect(stopStreamSpy).toHaveBeenCalled();
        });

        it('should call timers.clearAllTimers', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const clearAllTimersSpy = vi.spyOn(state.timers, 'clearAllTimers');
            await state.cleanup();
            expect(clearAllTimersSpy).toHaveBeenCalled();
        });

        it('should call errorHandling.clearError', async () => {
            const state = useBaseDeviceTest(defaultOptions);
            const clearErrorSpy = vi.spyOn(state.errorHandling, 'clearError');
            await state.cleanup();
            expect(clearErrorSpy).toHaveBeenCalled();
        });
    });
});
