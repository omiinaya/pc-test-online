// Composable for managing media streams with cross-browser compatibility
import { ref } from 'vue';
import { useWebRTCCompatibility } from './useWebRTCCompatibility';

export function useMediaStream() {
    const stream = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Use WebRTC compatibility layer
    const webrtcCompat = useWebRTCCompatibility();

    const createStream = async constraints => {
        loading.value = true;
        error.value = null;

        try {
            if (stream.value) {
                stopStream();
            }

            // Use compatibility layer instead of direct API access
            stream.value = await webrtcCompat.getUserMedia(constraints);
            return stream.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const stopStream = () => {
        if (stream.value) {
            stream.value.getTracks().forEach(track => track.stop());
            stream.value = null;
        }
    };

    const switchDevice = async (newDeviceId, deviceType, baseConstraints) => {
        if (loading.value) return;

        loading.value = true;
        error.value = null;

        try {
            stopStream();

            const constraints = {
                ...baseConstraints,
                [deviceType]: {
                    ...baseConstraints[deviceType],
                    deviceId: { exact: newDeviceId },
                },
            };

            return await createStream(constraints);
        } catch (err) {
            error.value = `Failed to switch device: ${err.message}`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const cleanup = () => {
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
