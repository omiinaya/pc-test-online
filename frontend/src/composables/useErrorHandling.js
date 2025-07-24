// Error handling composable for test components
import { ref } from 'vue';

/**
 * Composable for standardized error handling across test components
 */
export function useErrorHandling(componentName = 'Component') {
    const error = ref(null);
    const hasError = ref(false);

    // Standard error messages for common scenarios
    const errorMessages = {
        // Permission errors
        PERMISSION_DENIED: deviceType =>
            `${deviceType} access was denied. Please enable ${deviceType.toLowerCase()} permissions in your browser settings.`,
        PERMISSION_TIMEOUT: deviceType =>
            `${deviceType} permission request timed out. Please try again.`,

        // Device errors
        DEVICE_NOT_FOUND: deviceType =>
            `No ${deviceType.toLowerCase()} devices found on your system.`,
        DEVICE_BUSY: deviceType => `${deviceType} is already in use by another application.`,
        DEVICE_TIMEOUT: deviceType =>
            `${deviceType} detection timed out. Please check your ${deviceType.toLowerCase()} connection.`,
        DEVICE_SWITCH_FAILED: deviceType =>
            `Failed to switch ${deviceType.toLowerCase()}. Please try again.`,

        // Browser support errors
        BROWSER_NOT_SUPPORTED: feature => `${feature} is not supported in this browser.`,
        HTTPS_REQUIRED: () =>
            'HTTPS is required for device access. Please use a secure connection.',

        // Generic errors
        INITIALIZATION_FAILED: componentName =>
            `Failed to initialize ${componentName}. Please refresh the page and try again.`,
        UNEXPECTED_ERROR: operation =>
            `An unexpected error occurred during ${operation}. Please try again.`,
    };

    /**
     * Set an error with a standardized message
     */
    const setError = (errorType, ...params) => {
        const messageFunction = errorMessages[errorType];
        if (messageFunction) {
            error.value = messageFunction(...params);
        } else {
            error.value = errorType; // Fallback to the errorType string itself
        }
        hasError.value = true;
        console.error(`${componentName}: ${error.value}`);
    };

    /**
     * Set a custom error message
     */
    const setCustomError = message => {
        error.value = message;
        hasError.value = true;
        console.error(`${componentName}: ${message}`);
    };

    /**
     * Handle JavaScript errors and convert them to user-friendly messages
     */
    const handleError = (err, context = 'operation') => {
        console.error(`${componentName}: Error in ${context}:`, err);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('PERMISSION_DENIED', context);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('DEVICE_NOT_FOUND', context);
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('DEVICE_BUSY', context);
        } else if (
            err.name === 'OverconstrainedError' ||
            err.name === 'ConstraintNotSatisfiedError'
        ) {
            setCustomError(
                `The selected device doesn't meet the required constraints: ${err.message}`
            );
        } else if (err.name === 'NotSupportedError') {
            setError('BROWSER_NOT_SUPPORTED', context);
        } else if (err.name === 'AbortError') {
            setCustomError(`${context} was cancelled.`);
        } else if (err.message?.includes('https')) {
            setError('HTTPS_REQUIRED');
        } else {
            setError('UNEXPECTED_ERROR', context);
        }
    };

    /**
     * Clear current error
     */
    const clearError = () => {
        error.value = null;
        hasError.value = false;
    };

    /**
     * Check if error is of a specific type
     */
    const isErrorType = (checkError, type) => {
        if (!checkError) return false;
        return checkError.includes(errorMessages[type]?.() || type);
    };

    return {
        // State
        error,
        hasError,

        // Methods
        setError,
        setCustomError,
        handleError,
        clearError,
        isErrorType,

        // Error message constants for reference
        errorMessages,
    };
}
