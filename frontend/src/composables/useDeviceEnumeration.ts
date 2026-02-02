import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useWebRTCCompatibility } from './useWebRTCCompatibility';
import type { DeviceInfo, DeviceKind, DeviceType } from '../types';

export interface UseDeviceEnumerationReturn {
  availableDevices: Ref<DeviceInfo[]>;
  selectedDeviceId: Ref<string>;
  loadingDevices: Ref<boolean>;
  deviceLoadingStart: Ref<number | null>;
  enumerationError: Ref<string | null>;
  hasDevices: ComputedRef<boolean>;
  enumerateDevices: () => Promise<void>;
  selectDevice: (deviceId: string) => void;
  reset: () => void;
  webrtcCompat: ReturnType<typeof useWebRTCCompatibility>;
}

export function useDeviceEnumeration(
  deviceKind: DeviceKind,
  deviceType: DeviceType
): UseDeviceEnumerationReturn {
  const availableDevices: Ref<DeviceInfo[]> = ref([]);
  const selectedDeviceId: Ref<string> = ref('');
  const loadingDevices: Ref<boolean> = ref(false);
  const deviceLoadingStart: Ref<number | null> = ref(null);
  const enumerationError: Ref<string | null> = ref(null);

  // Use WebRTC compatibility layer
  const webrtcCompat = useWebRTCCompatibility();

  const hasDevices: ComputedRef<boolean> = computed(() => availableDevices.value.length > 0);

  const enumerateDevices = async (): Promise<void> => {
    loadingDevices.value = true;
    deviceLoadingStart.value = Date.now();
    enumerationError.value = null;

    // Add timeout for enumeration
    let enumerationTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
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
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Enumeration timeout')), 4000)
        ),
      ]);

      if (enumerationTimeout) {
        clearTimeout(enumerationTimeout);
        enumerationTimeout = null;
      }

      const filteredDevices = devices.filter((device: DeviceInfo) => device.kind === deviceKind);

      availableDevices.value = filteredDevices;

      // Auto-select first device if none selected
      if (!selectedDeviceId.value && filteredDevices.length > 0) {
        selectedDeviceId.value = filteredDevices[0]?.deviceId ?? '';
      }

      if (filteredDevices.length === 0) {
        selectedDeviceId.value = '';
        // Ensure spinner shows for at least 1 second
        const elapsed = Date.now() - (deviceLoadingStart.value || 0);
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
    } catch (err: unknown) {
      if (enumerationTimeout) {
        clearTimeout(enumerationTimeout);
        enumerationTimeout = null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`${deviceType}: Error enumerating devices:`, err);
      loadingDevices.value = false;
      enumerationError.value = `Failed to enumerate ${deviceType.toLowerCase()}s: ${errorMessage}`;
    }
  };

  const selectDevice = (deviceId: string): void => {
    selectedDeviceId.value = deviceId;
  };

  const reset = (): void => {
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
    deviceLoadingStart,
    enumerationError,
    hasDevices,
    enumerateDevices,
    selectDevice,
    reset,
    webrtcCompat,
  };
}