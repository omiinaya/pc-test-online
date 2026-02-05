import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue';
import type { UseDeviceEnumerationReturn } from './useDeviceEnumeration';

export interface UseDeviceDetectionDelayReturn {
    shouldShowNoDevices: ComputedRef<boolean>;
    showNoDevicesMessage: Ref<boolean>;
    startDetection: () => void;
    stopDetection: () => void;
    resetDetection: () => void;
    detectionState: ComputedRef<{
        isLoading: boolean;
        hasDevices: boolean;
        showNoDevicesMessage: boolean;
        shouldShowNoDevices: boolean;
        detectionStartTime: number | null;
        elapsedTime: number | null;
    }>;
}

export interface DetectionState {
    isLoading: boolean;
    hasDevices: boolean;
    showNoDevicesMessage: boolean;
    shouldShowNoDevices: boolean;
    detectionStartTime: number | null;
    elapsedTime: number | null;
}

/**
 * Composable for managing device detection delay
 * Ensures "No device found" messages only show after a specified delay
 */
export function useDeviceDetectionDelay(
    deviceEnumeration: UseDeviceEnumerationReturn,
    delayMs: number = 2000
): UseDeviceDetectionDelayReturn {
    const detectionStartTime: Ref<number | null> = ref(null);
    const showNoDevicesMessage: Ref<boolean> = ref(false);
    const detectionTimer: Ref<NodeJS.Timeout | null> = ref(null);

    // Start detection timing when enumeration begins
    const startDetection = (): void => {
        detectionStartTime.value = Date.now();
        showNoDevicesMessage.value = false;

        // Clear any existing timer
        if (detectionTimer.value) {
            clearTimeout(detectionTimer.value);
            detectionTimer.value = null;
        }

        // Set timer to show no devices message after delay
        detectionTimer.value = setTimeout(() => {
            // Only show message if we still don't have devices and enumeration is complete
            if (!deviceEnumeration.hasDevices.value && !deviceEnumeration.loadingDevices.value) {
                showNoDevicesMessage.value = true;
            }
            detectionTimer.value = null;
        }, delayMs);
    };

    // Stop detection timing when devices are found or enumeration succeeds
    const stopDetection = (): void => {
        if (detectionTimer.value) {
            clearTimeout(detectionTimer.value);
            detectionTimer.value = null;
        }
        showNoDevicesMessage.value = false;
    };

    // Reset detection state
    const resetDetection = (): void => {
        detectionStartTime.value = null;
        showNoDevicesMessage.value = false;
        if (detectionTimer.value) {
            clearTimeout(detectionTimer.value);
            detectionTimer.value = null;
        }
    };

    // Watch for changes in device loading state
    watch(
        () => deviceEnumeration.loadingDevices.value,
        (isLoading, wasLoading) => {
            if (isLoading && !wasLoading) {
                // Started loading devices
                startDetection();
            } else if (!isLoading && wasLoading) {
                // Finished loading devices
                if (deviceEnumeration.hasDevices.value) {
                    // Found devices, stop detection
                    stopDetection();
                }
                // If no devices found, let the timer continue and show message after delay
            }
        },
        { immediate: true }
    );

    // Watch for devices being found
    watch(
        () => deviceEnumeration.hasDevices.value,
        hasDevices => {
            if (hasDevices) {
                stopDetection();
            }
        },
        { immediate: true }
    );

    // Computed property to determine if we should show the "no devices" UI
    const shouldShowNoDevices: ComputedRef<boolean> = computed(() => {
        // Don't show if we're still loading
        if (deviceEnumeration.loadingDevices.value) {
            return false;
        }

        // Don't show if we have devices
        if (deviceEnumeration.hasDevices.value) {
            return false;
        }

        // Only show if enough time has passed or we explicitly decided to show the message
        return showNoDevicesMessage.value;
    });

    // Computed property for debugging
    const detectionState: ComputedRef<DetectionState> = computed(() => ({
        isLoading: deviceEnumeration.loadingDevices.value,
        hasDevices: deviceEnumeration.hasDevices.value,
        showNoDevicesMessage: showNoDevicesMessage.value,
        shouldShowNoDevices: shouldShowNoDevices.value,
        detectionStartTime: detectionStartTime.value,
        elapsedTime: detectionStartTime.value ? Date.now() - detectionStartTime.value : null,
    }));

    // Cleanup on unmount
    onUnmounted(() => {
        if (detectionTimer.value) {
            clearTimeout(detectionTimer.value);
        }
    });

    return {
        shouldShowNoDevices,
        showNoDevicesMessage,
        startDetection,
        stopDetection,
        resetDetection,
        detectionState,
    };
}
