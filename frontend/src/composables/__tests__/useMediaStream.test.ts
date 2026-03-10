import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaStream } from '../useMediaStream';

// Mock MediaStream and tracks globally
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

afterEach(() => {
    vi.clearAllMocks();
});

// Mock dependencies
vi.mock('../useWebRTCCompatibility', () => ({
    useWebRTCCompatibility: vi.fn(() => ({
        getUserMedia: vi.fn().mockImplementation(async () => new MediaStream()),
    })),
}));

vi.mock('../useMemoryManagement', () => ({
    useMemoryManagement: vi.fn(() => ({
        trackResource: vi.fn().mockReturnValue(123),
        untrackResource: vi.fn(),
        cleanupType: vi.fn(),
    })),
}));

describe('useMediaStream', () => {
    it('should initialize with null stream, loading false, error null', () => {
        const media = useMediaStream();
        expect(media.stream.value).toBeNull();
        expect(media.loading.value).toBe(false);
        expect(media.error.value).toBeNull();
    });

    describe('createStream', () => {
        it('should create a stream and set it', async () => {
            const media = useMediaStream();
            const constraints = { video: true, audio: true };
            const result = await media.createStream(constraints);
            expect(result).toBeInstanceOf(MediaStream);
            expect(media.stream.value).toBeInstanceOf(MediaStream);
        });

        it('should set loading true during creation', async () => {
            const media = useMediaStream();
            const promise = media.createStream({ audio: true });
            // At this point, loading should be true
            expect(media.loading.value).toBe(true);
            await promise;
            expect(media.loading.value).toBe(false);
        });

        it('should set error and throw on failure', async () => {
            const media = useMediaStream();
            // Force getUserMedia to reject
            const { webrtcCompat } = media;
            (webrtcCompat.getUserMedia as any).mockRejectedValueOnce(new Error('NotAllowed'));

            await expect(media.createStream({ audio: true })).rejects.toThrow('NotAllowed');
            expect(media.error.value).toBe('NotAllowed');
        });
    });

    describe('stopStream', () => {
        it('should stop all tracks and clear stream', async () => {
            const media = useMediaStream();
            await media.createStream({ audio: true });
            const stream = media.stream.value;
            const stopSpies: any[] = [];
            stream!.getTracks().forEach(track => {
                stopSpies.push(vi.spyOn(track, 'stop'));
            });

            media.stopStream();

            expect(media.stream.value).toBeNull();
            stopSpies.forEach(spy => expect(spy).toHaveBeenCalled());
        });

        it('should handle no stream gracefully', () => {
            const media = useMediaStream();
            expect(() => media.stopStream()).not.toThrow();
            expect(media.stream.value).toBeNull();
        });
    });

    describe('switchDevice', () => {
        it('should stop old stream and create new one', async () => {
            const media = useMediaStream();
            const initialStream = await media.createStream({ audio: true });
            expect(media.stream.value).toBe(initialStream);

            const newStream = await media.switchDevice('new-device-id', 'microphone', {
                audio: true,
            });
            expect(newStream).toBeInstanceOf(MediaStream);
            expect(media.stream.value).toBeInstanceOf(MediaStream);
            expect(media.stream.value).not.toBe(initialStream);
        });

        it('should throw if called while loading', async () => {
            const media = useMediaStream();
            const pending = media.createStream({ audio: true });
            await expect(
                media.switchDevice('new-id', 'microphone', { audio: true })
            ).rejects.toThrow('Cannot switch device while loading');
            await pending;
        });
    });

    describe('cleanup', () => {
        it('should stop stream and clear error/loading', async () => {
            const media = useMediaStream();
            await media.createStream({ audio: true });
            media.error.value = 'Some error';
            media.loading.value = true;

            media.cleanup();

            expect(media.stream.value).toBeNull();
            expect(media.error.value).toBeNull();
            expect(media.loading.value).toBe(false);
        });
    });
});
