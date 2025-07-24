// Composable for handling media device permissions
import { ref } from 'vue';

export function useMediaPermissions(deviceType, permissionName) {
    console.log(`[useMediaPermissions:${deviceType}] Initializing for permission:`, permissionName);

    const permissionGranted = ref(false);
    const permissionDenied = ref(false);
    const checkingPermission = ref(true);
    const isElectron = ref(window.electronAPI && window.electronMedia);

    const initializePermissions = async () => {
        // Check for basic device support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(`${deviceType} is not supported in this browser.`);
        }

        // Start in checking state
        checkingPermission.value = true;

        // Handle Electron differently
        if (isElectron.value) {
            console.log(`[useMediaPermissions:${deviceType}] Using Electron permission flow`);
            await handleElectronPermissions();
        } else {
            console.log(`[useMediaPermissions:${deviceType}] Using browser permission flow`);
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
        }
    };

    const handleElectronPermissions = async () => {
        try {
            // In Electron, check if media support is available
            const mediaSupport = await window.electronMedia.hasMediaSupport();

            if (mediaSupport.supported) {
                console.log(`[useMediaPermissions:${deviceType}] Testing system-level permissions`);

                // First, try to request system-level permissions which will trigger Windows dialogs
                const systemPermissions =
                    await window.electronMedia.requestSystemMediaPermissions();
                console.log(
                    `[useMediaPermissions:${deviceType}] System permission result:`,
                    systemPermissions
                );

                if (systemPermissions.success) {
                    // For Electron, we need to explicitly request permissions based on device type
                    if (deviceType === 'webcam' || permissionName === 'camera') {
                        if (systemPermissions.hasVideo) {
                            console.log(
                                `[useMediaPermissions:${deviceType}] Camera available from system test`
                            );
                            permissionGranted.value = true;
                            permissionDenied.value = false;
                        } else {
                            console.log(
                                `[useMediaPermissions:${deviceType}] Camera not available from system test`
                            );
                            permissionDenied.value = true;
                            permissionGranted.value = false;
                        }
                    } else if (deviceType === 'microphone' || permissionName === 'microphone') {
                        if (systemPermissions.hasAudio) {
                            console.log(
                                `[useMediaPermissions:${deviceType}] Microphone available from system test`
                            );
                            permissionGranted.value = true;
                            permissionDenied.value = false;
                        } else {
                            console.log(
                                `[useMediaPermissions:${deviceType}] Microphone not available from system test`
                            );
                            permissionDenied.value = true;
                            permissionGranted.value = false;
                        }
                    } else {
                        // Default to granted for other device types
                        permissionGranted.value = true;
                        permissionDenied.value = false;
                    }
                } else {
                    throw new Error(`System media permissions failed: ${systemPermissions.error}`);
                }

                checkingPermission.value = false;
                console.log(
                    `[useMediaPermissions:${deviceType}] Electron permissions result: granted=${permissionGranted.value}`
                );
            } else {
                throw new Error('Media support not available in Electron');
            }
        } catch (error) {
            console.error(
                `[useMediaPermissions:${deviceType}] Electron permission check failed:`,
                error
            );

            // Provide helpful guidance to user
            if (error.message.includes('Permission denied by system')) {
                console.log(
                    `[useMediaPermissions:${deviceType}] Windows system permissions are blocking access`
                );

                // Try to open Windows settings to help user
                if (window.electronMedia?.openWindowsCameraSettings) {
                    try {
                        const settingsResult =
                            await window.electronMedia.openWindowsCameraSettings();
                        console.log(
                            `[useMediaPermissions:${deviceType}] Settings guidance:`,
                            settingsResult.message
                        );
                    } catch (settingsError) {
                        console.log(
                            `[useMediaPermissions:${deviceType}] Could not open settings:`,
                            settingsError
                        );
                    }
                }
            }

            permissionDenied.value = true;
            permissionGranted.value = false;
            checkingPermission.value = false;
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
            // Handle Electron permission request
            if (isElectron.value) {
                console.log(
                    `[useMediaPermissions:${deviceType}] Requesting Electron permissions for:`,
                    constraints
                );

                // Request permissions through Electron bridge
                const permissionResult = await window.electronMedia.requestPermissions(constraints);

                if (permissionResult.granted) {
                    // Now try to get the actual media stream
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    permissionGranted.value = true;
                    permissionDenied.value = false;
                    return stream;
                } else {
                    throw new Error(permissionResult.error || 'Permission denied by Electron');
                }
            } else {
                // Standard browser flow
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                permissionGranted.value = true;
                permissionDenied.value = false;
                return stream;
            }
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
        isElectron,

        // Methods
        initializePermissions,
        checkPermissionsInBackground,
        handlePermissionState,
        handleElectronPermissions,
        requestPermission,
        resetPermissions,
    };
}
