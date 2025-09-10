// Composable for handling media device permissions
import { ref } from 'vue';

export function useMediaPermissions(deviceType, permissionName) {
    console.log(`[useMediaPermissions:${deviceType}] Initializing for permission:`, permissionName);

    const permissionGranted = ref(false);
    const permissionDenied = ref(false);
    const checkingPermission = ref(true);

    const initializePermissions = async () => {
        // Check for basic device support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(`${deviceType} is not supported in this browser.`);
        }

        // Start in checking state
        checkingPermission.value = true;

        // Try to check permissions in the background first
        const permissionState = await checkPermissionsInBackground();

        // If we got a definitive answer, use it
        if (permissionState) {
            handlePermissionState(permissionState);
        } else {
            // Fallback: assume we need to request permission
            checkingPermission.value = false;
            permissionGranted.value = false;
            permissionDenied.value = false;
        }
    };

    const checkPermissionsInBackground = async () => {
        // Check for Permissions API
        if (typeof navigator.permissions?.query !== 'function') {
            return null;
        }

        try {
            const permissionStatus = await navigator.permissions.query({
                name: permissionName,
            });

            // React to permission changes made by the user in browser settings
            permissionStatus.onchange = () => {
                handlePermissionState(permissionStatus.state);
            };

            return permissionStatus.state;
        } catch (err) {
            // Silent failure - return null so we fall back to showing request button
            return null;
        }
    };

    const handlePermissionState = state => {
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
    };

    const requestPermission = async constraints => {
        try {
            // Standard browser flow
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            permissionGranted.value = true;
            permissionDenied.value = false;
            return stream;
        } catch (err) {
            console.error(`${deviceType} access error:`, err);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                permissionDenied.value = true;
                permissionGranted.value = false;
                throw new Error(`${deviceType} access denied`);
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                // Device not found - this should have been caught earlier, but handle it
                throw new Error(`No ${deviceType.toLowerCase()} device found`);
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                throw new Error(`${deviceType} is already in use by another application`);
            } else {
                throw new Error(`${deviceType} error: ${err.message}`);
            }
        }
    };

    const resetPermissions = () => {
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
