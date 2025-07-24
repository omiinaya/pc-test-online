// Composable for common StatePanel configurations

/**
 * Composable for standardized StatePanel configurations
 */
export function useStatePanelConfigs(deviceType = 'device') {
    // Common StatePanel configurations for different states
    const configs = {
        // Loading states
        detectingDevices: {
            state: 'loading',
            title: `Detecting ${deviceType}s...`,
            message: `Please wait while we search for available ${deviceType.toLowerCase()}s`,
        },

        checkingPermissions: {
            state: 'loading',
            title: 'Checking permissions...',
            message: `Verifying ${deviceType.toLowerCase()} access permissions`,
        },

        initializing: {
            state: 'loading',
            title: 'Initializing...',
            message: `Setting up ${deviceType.toLowerCase()} test`,
        },

        // Permission states
        permissionRequired: {
            state: 'info',
            title: `${deviceType} Permission Required`,
            message: `Please allow ${deviceType.toLowerCase()} access to test your ${deviceType.toLowerCase()}.`,
            showActionButton: true,
            actionLabel: `Grant ${deviceType} Access`,
        },

        permissionDenied: {
            state: 'error',
            title: `${deviceType} Access Denied`,
            message: `${deviceType} access was denied. Please enable ${deviceType.toLowerCase()} permissions in your browser settings and refresh the page.`,
        },

        // Error states
        noDevicesFound: {
            state: 'error',
            title: `No ${deviceType}s Found`,
            message: `No ${deviceType.toLowerCase()}s were found on your system.`,
        },

        deviceBusy: {
            state: 'error',
            title: `${deviceType} Unavailable`,
            message: `${deviceType} is currently being used by another application. Please close other applications and try again.`,
        },

        deviceTimeout: {
            state: 'error',
            title: `${deviceType} Detection Timeout`,
            message: `${deviceType} detection timed out. Please check your ${deviceType.toLowerCase()} connection and try again.`,
        },

        browserNotSupported: {
            state: 'error',
            title: 'Browser Not Supported',
            message: `${deviceType} testing is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.`,
        },

        httpsRequired: {
            state: 'error',
            title: 'HTTPS Required',
            message: `${deviceType} access requires a secure connection. Please use HTTPS.`,
        },

        // Success states
        testCompleted: {
            state: 'success',
            title: 'Test Completed',
            message: `${deviceType} test completed successfully!`,
        },

        testSkipped: {
            state: 'info',
            title: 'Test Skipped',
            message: `${deviceType} test was skipped.`,
        },
    };

    /**
     * Get configuration for a specific state
     */
    const getConfig = (stateName, customProps = {}) => {
        const baseConfig = configs[stateName];
        if (!baseConfig) {
            console.warn(`StatePanel config '${stateName}' not found`);
            return {};
        }

        return {
            ...baseConfig,
            ...customProps,
        };
    };

    /**
     * Get configuration with custom device type
     */
    const getConfigForDevice = (stateName, customDeviceType, customProps = {}) => {
        const baseConfig = configs[stateName];
        if (!baseConfig) {
            console.warn(`StatePanel config '${stateName}' not found`);
            return {};
        }

        // Replace device type in title and message
        const updatedConfig = {
            ...baseConfig,
            title: baseConfig.title.replace(new RegExp(deviceType, 'gi'), customDeviceType),
            message: baseConfig.message.replace(
                new RegExp(deviceType.toLowerCase(), 'gi'),
                customDeviceType.toLowerCase()
            ),
        };

        return {
            ...updatedConfig,
            ...customProps,
        };
    };

    /**
     * Get error configuration based on error type
     */
    const getErrorConfig = (error, customProps = {}) => {
        if (!error) return null;

        const errorString = error.toString().toLowerCase();

        if (errorString.includes('permission') || errorString.includes('denied')) {
            return getConfig('permissionDenied', customProps);
        } else if (errorString.includes('not found') || errorString.includes('no device')) {
            return getConfig('noDevicesFound', customProps);
        } else if (errorString.includes('busy') || errorString.includes('in use')) {
            return getConfig('deviceBusy', customProps);
        } else if (errorString.includes('timeout')) {
            return getConfig('deviceTimeout', customProps);
        } else if (errorString.includes('not supported')) {
            return getConfig('browserNotSupported', customProps);
        } else if (errorString.includes('https')) {
            return getConfig('httpsRequired', customProps);
        } else {
            return {
                state: 'error',
                title: 'An Error Occurred',
                message: error.toString(),
                ...customProps,
            };
        }
    };

    return {
        // All configurations
        configs,

        // Methods
        getConfig,
        getConfigForDevice,
        getErrorConfig,
    };
}
