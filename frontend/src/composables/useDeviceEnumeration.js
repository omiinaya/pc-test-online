import { ref, computed } from 'vue';
import { useWebRTCCompatibility } from './useWebRTCCompatibility';

export function useDeviceEnumeration(deviceKind, deviceType) {
    const availableDevices = ref([]);
    const selectedDeviceId = ref('');
    const loadingDevices = ref(false);
    const deviceLoadingStart = ref(null);
    const enumerationError = ref(null);

    // Use WebRTC compatibility layer
    const webrtcCompat = useWebRTCCompatibility();

    const hasDevices = computed(() => availableDevices.value.length > 0);

    const enumerateDevices = async () => {
        loadingDevices.value = true;
        deviceLoadingStart.value = Date.now();
        enumerationError.value = null;

        // Add timeout for enumeration
        const enumerationTimeout = setTimeout(() => {
            console.warn(`${deviceType}: Device enumeration timed out after 5 seconds`);
            if (availableDevices.value.length === 0) {
                loadingDevices.value = false;
                enumerationError.value = `${deviceType} detection timed out. Please check your ${deviceType.toLowerCase()} connection.`;
            }
        }, 5000);

        try {
            // Use compatibility layer instead of direct API access
            const devices = await Promise.race([
                webrtcCompat.enumerateDevices(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Enumeration timeout')), 4000)
                ),
            ]);

            clearTimeout(enumerationTimeout);

            const filteredDevices = devices.filter(device => device.kind === deviceKind);

            availableDevices.value = filteredDevices;

            // Auto-select first device if none selected
            if (!selectedDeviceId.value && filteredDevices.length > 0) {
                selectedDeviceId.value = filteredDevices[0].deviceId;
            }

            if (filteredDevices.length === 0) {
                selectedDeviceId.value = '';
                // Ensure spinner shows for at least 1 second
                const elapsed = Date.now() - deviceLoadingStart.value;
                const minDelay = 1000;
                if (elapsed < minDelay) {
                    setTimeout(() => {
                        loadingDevices.value = false;
                    }, minDelay - elapsed);
                } else {
                    loadingDevices.value = false;
                }
            } else {
                loadingDevices.value = false;
            }
        } catch (err) {
            clearTimeout(enumerationTimeout);
            console.error(`${deviceType}: Error enumerating devices:`, err);
            loadingDevices.value = false;
            enumerationError.value = `Failed to enumerate ${deviceType.toLowerCase()}s.`;
        }
    };

    const selectDevice = deviceId => {
        selectedDeviceId.value = deviceId;
    };

    const reset = () => {
        availableDevices.value = [];
        selectedDeviceId.value = '';
        loadingDevices.value = false;
        deviceLoadingStart.value = null;
        enumerationError.value = null;
    };

    return {
        availableDevices,
        selectedDeviceId,
        loadingDevices,
        enumerationError,
        hasDevices,
        enumerateDevices,
        selectDevice,
        reset,

        // Compatibility info
        webrtcCompat,
    };
}
