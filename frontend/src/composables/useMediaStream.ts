// Composable for managing media streams with cross-browser compatibility
import { ref, type Ref } from 'vue';
import { useWebRTCCompatibility } from './useWebRTCCompatibility';
import type { DeviceConstraints } from '../types';

export function useMediaStream() {
    const stream: Ref<MediaStream | null> = ref(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Use WebRTC compatibility layer
    const webrtcCompat = useWebRTCCompatibility();

    const createStream = async (constraints: DeviceConstraints): Promise<MediaStream | null> => {
        loading.value = true;
        error.value = null;

        try {
            if (stream.value) {
                stopStream();
            }

            // Use compatibility layer instead of direct API access
            const newStream = await webrtcCompat.getUserMedia(constraints);
            stream.value = newStream;
            return stream.value;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            error.value = errorMessage;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const stopStream = (): void => {
        if (stream.value) {
            stream.value.getTracks().forEach(track => track.stop());
            stream.value = null;
        }
    };

    const switchDevice = async (
        newDeviceId: string,
        deviceType: 'video' | 'audio',
        baseConstraints: DeviceConstraints
    ): Promise<MediaStream | null> => {
        if (loading.value) return null;

        loading.value = true;
        error.value = null;

        try {
            stopStream();

            const constraints: DeviceConstraints = {
                ...baseConstraints,
                [deviceType]: {
                    ...baseConstraints[deviceType],
                    deviceId: { exact: newDeviceId },
                },
            };

            return await createStream(constraints);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            error.value = `Failed to switch device: ${errorMessage}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const cleanup = (): void => {
        stopStream();
        error.value = null;
        loading.value = false;
    };

    return {
        // State
        stream,
        loading,
        error,

        // Methods
        createStream,
        stopStream,
        switchDevice,
        cleanup,

        // Compatibility info
        webrtcCompat,
    };
}
