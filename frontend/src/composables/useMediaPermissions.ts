import { ref, type Ref } from 'vue';
import type { DeviceType, PermissionName, DeviceConstraints } from '../types';

export interface UseMediaPermissionsReturn {
    permissionGranted: Ref<boolean>;
    permissionDenied: Ref<boolean>;
    checkingPermission: Ref<boolean>;
    initializePermissions: () => Promise<void>;
    checkPermissionsInBackground: () => Promise<PermissionState | null>;
    handlePermissionState: (state: PermissionState) => PermissionState;
    requestPermission: (constraints: DeviceConstraints) => Promise<MediaStream>;
    resetPermissions: () => void;
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | null;

export function useMediaPermissions(
    deviceType: DeviceType,
    permissionName: PermissionName
): UseMediaPermissionsReturn {
    console.log(`[useMediaPermissions:${deviceType}] Initializing for permission:`, permissionName);

    const permissionGranted: Ref<boolean> = ref(false);
    const permissionDenied: Ref<boolean> = ref(false);
    const checkingPermission: Ref<boolean> = ref(true);

    const initializePermissions = async (): Promise<void> => {
        console.log(`[useMediaPermissions:${deviceType}] initializePermissions() called`);
        // Check for basic device support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error(`[useMediaPermissions:${deviceType}] getUserMedia not supported`);
            throw new Error(`${deviceType} is not supported in this browser.`);
        }

        // Start in checking state
        checkingPermission.value = true;
        console.log(`[useMediaPermissions:${deviceType}] checkingPermission set to true`);

        // Try to check permissions in the background first
        console.log(`[useMediaPermissions:${deviceType}] Checking permissions in background`);
        const permissionState = await checkPermissionsInBackground();
        console.log(
            `[useMediaPermissions:${deviceType}] Background permission check result:`,
            permissionState
        );

        // If we got a definitive answer, use it
        if (permissionState) {
            console.log(
                `[useMediaPermissions:${deviceType}] Handling permission state:`,
                permissionState
            );
            handlePermissionState(permissionState);
        } else {
            // Fallback: assume we need to request permission
            console.log(
                `[useMediaPermissions:${deviceType}] No definitive permission state, showing permission prompt`
            );
            checkingPermission.value = false;
            permissionGranted.value = false;
            permissionDenied.value = false;
        }
    };

    const checkPermissionsInBackground = async (): Promise<PermissionState | null> => {
        // Check for Permissions API
        if (typeof navigator.permissions?.query !== 'function') {
            return null;
        }

        try {
            const permissionStatus = await navigator.permissions.query({
                name: permissionName as PermissionDescriptor['name'],
            });

            // React to permission changes made by the user in browser settings
            permissionStatus.onchange = () => {
                handlePermissionState(permissionStatus.state as PermissionState);
            };

            return permissionStatus.state as PermissionState;
        } catch (err) {
            // Silent failure - return null so we fall back to showing request button
            return null;
        }
    };

    const handlePermissionState = (state: PermissionState): PermissionState => {
        checkingPermission.value = false;

        if (state === 'granted') {
            permissionGranted.value = true;
            permissionDenied.value = false;
            return 'granted';
        } else if (state === 'prompt') {
            permissionGranted.value = false;
            permissionDenied.value = false;
            return 'prompt';
        } else if (state === 'denied') {
            permissionDenied.value = true;
            permissionGranted.value = false;
            return 'denied';
        }

        return null;
    };

    const requestPermission = async (constraints: DeviceConstraints): Promise<MediaStream> => {
        console.log(
            `[useMediaPermissions:${deviceType}] requestPermission() called with constraints:`,
            constraints
        );
        try {
            // Standard browser flow
            console.log(
                `[useMediaPermissions:${deviceType}] Calling navigator.mediaDevices.getUserMedia()`
            );
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log(
                `[useMediaPermissions:${deviceType}] Permission granted, stream created:`,
                stream
            );
            permissionGranted.value = true;
            permissionDenied.value = false;
            console.log(
                `[useMediaPermissions:${deviceType}] permissionGranted:`,
                permissionGranted.value
            );
            return stream;
        } catch (err: unknown) {
            console.error(`[useMediaPermissions:${deviceType}] access error:`, err);

            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    console.log(`[useMediaPermissions:${deviceType}] Permission denied`);
                    permissionDenied.value = true;
                    permissionGranted.value = false;
                    throw new Error(`${deviceType} access denied`);
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    // Device not found - this should have been caught earlier, but handle it
                    console.log(`[useMediaPermissions:${deviceType}] Device not found`);
                    throw new Error(`No ${deviceType.toLowerCase()} device found`);
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    console.log(`[useMediaPermissions:${deviceType}] Device already in use`);
                    throw new Error(`${deviceType} is already in use by another application`);
                } else {
                    console.log(`[useMediaPermissions:${deviceType}] Unknown error:`, err.message);
                    throw new Error(`${deviceType} error: ${err.message}`);
                }
            } else {
                console.log(`[useMediaPermissions:${deviceType}] Unknown error type`);
                throw new Error(`${deviceType} error: Unknown error occurred`);
            }
        }
    };

    const resetPermissions = (): void => {
        permissionGranted.value = false;
        permissionDenied.value = false;
        checkingPermission.value = true;
    };

    return {
        // State
        permissionGranted,
        permissionDenied,
        checkingPermission,

        // Methods
        initializePermissions,
        checkPermissionsInBackground,
        handlePermissionState,
        requestPermission,
        resetPermissions,
    };
}
