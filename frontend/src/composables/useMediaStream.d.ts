/**
 * @ignore
 * Type declarations for useMediaStream composable
 */
import type { Ref } from 'vue';
import type { DeviceConstraints } from '../types';
import type { WebRTCCompatibilityReturn } from './useWebRTCCompatibility';

declare interface UseMediaStreamReturn {
    stream: Ref<MediaStream | null>;
    loading: Ref<boolean>;
    error: Ref<string | null>;
    createStream: (constraints: DeviceConstraints) => Promise<MediaStream | null>;
    stopStream: () => void;
    switchDevice: (
        newDeviceId: string,
        deviceType: 'video' | 'audio',
        baseConstraints: DeviceConstraints
    ) => Promise<MediaStream | null>;
    cleanup: () => void;
    webrtcCompat: WebRTCCompatibilityReturn;
}

export declare function useMediaStream(): UseMediaStreamReturn;
