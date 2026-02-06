import type { StatePanelState } from '@/types';
import { replaceDeviceTypeCaseInsensitive } from '@/utils/regex';

/** @ignore */
interface StatePanelConfig {
    state: StatePanelState;
    title: string;
    message: string;
    showActionButton?: boolean;
    actionLabel?: string;
    [key: string]: unknown;
}

/** @ignore */
interface StatePanelConfigs {
    [key: string]: StatePanelConfig;
}

/** @ignore */
interface UseStatePanelConfigsReturn {
    configs: StatePanelConfigs;
    getConfig: (stateName: string, customProps?: Record<string, unknown>) => StatePanelConfig;
    getConfigForDevice: (
        stateName: string,
        customDeviceType: string,
        customProps?: Record<string, unknown>
    ) => StatePanelConfig;
    getErrorConfig: (
        error: unknown,
        customProps?: Record<string, unknown>
    ) => StatePanelConfig | null;
}

/**
 * Composable for standardized StatePanel configurations
 * @ignore
 */
export function useStatePanelConfigs(deviceType = 'device'): UseStatePanelConfigsReturn {
    // Common StatePanel configurations for different states
    const configs: StatePanelConfigs = {
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
    const getConfig = (
        stateName: string,
        customProps: Record<string, unknown> = {}
    ): StatePanelConfig => {
        const baseConfig = configs[stateName];
        if (!baseConfig) {
            console.warn(`StatePanel config '${stateName}' not found`);
            return {} as StatePanelConfig;
        }

        return {
            ...baseConfig,
            ...customProps,
        };
    };

    /**
     * Get configuration with custom device type
     */
    const getConfigForDevice = (
        stateName: string,
        customDeviceType: string,
        customProps: Record<string, unknown> = {}
    ): StatePanelConfig => {
        const baseConfig = configs[stateName];
        if (!baseConfig) {
            console.warn(`StatePanel config '${stateName}' not found`);
            return {} as StatePanelConfig;
        }

        // Replace device type in title and message using safe regex
        const updatedConfig = {
            ...baseConfig,
            title: replaceDeviceTypeCaseInsensitive(baseConfig.title, deviceType, customDeviceType),
            message: replaceDeviceTypeCaseInsensitive(
                baseConfig.message,
                deviceType,
                customDeviceType
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
    const getErrorConfig = (
        error: unknown,
        customProps: Record<string, unknown> = {}
    ): StatePanelConfig | null => {
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
            } as StatePanelConfig;
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
