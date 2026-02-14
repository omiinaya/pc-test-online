// Error handling composable for test components
import { ref, type Ref } from 'vue';

export interface ErrorMessages {
    PERMISSION_DENIED: (deviceType: string) => string;
    PERMISSION_TIMEOUT: (deviceType: string) => string;
    DEVICE_NOT_FOUND: (deviceType: string) => string;
    DEVICE_BUSY: (deviceType: string) => string;
    DEVICE_TIMEOUT: (deviceType: string) => string;
    DEVICE_SWITCH_FAILED: (deviceType: string) => string;
    BROWSER_NOT_SUPPORTED: (feature: string) => string;
    HTTPS_REQUIRED: () => string;
    INITIALIZATION_FAILED: (componentName: string) => string;
    UNEXPECTED_ERROR: (operation: string) => string;
    [key: string]: (...params: unknown[]) => string;
}

export interface UseErrorHandlingReturn {
    // State
    error: Ref<string | null>;
    hasError: Ref<boolean>;

    // Methods
    setError: (errorType: keyof ErrorMessages, ...params: unknown[]) => void;
    setCustomError: (message: string) => void;
    handleError: (err: unknown, context?: string) => void;
    clearError: () => void;
    isErrorType: (checkError: string | null, type: keyof ErrorMessages) => boolean;

    // Error message constants for reference
    errorMessages: ErrorMessages;
}

/**
 * Composable for standardized error handling across test components
 */
export function useErrorHandling(componentName: string = 'Component'): UseErrorHandlingReturn {
    const error: Ref<string | null> = ref(null);
    const hasError: Ref<boolean> = ref(false);

    // Standard error messages for common scenarios
    const errorMessages: ErrorMessages = {
        // Permission errors
        PERMISSION_DENIED: (deviceType: string): string =>
            `${deviceType} access was denied. Please enable ${deviceType.toLowerCase()} permissions in your browser settings.`,
        PERMISSION_TIMEOUT: (deviceType: string): string =>
            `${deviceType} permission request timed out. Please try again.`,

        // Device errors
        DEVICE_NOT_FOUND: (deviceType: string): string =>
            `No ${deviceType.toLowerCase()} devices found on your system.`,
        DEVICE_BUSY: (deviceType: string): string =>
            `${deviceType} is already in use by another application.`,
        DEVICE_TIMEOUT: (deviceType: string): string =>
            `${deviceType} detection timed out. Please check your ${deviceType.toLowerCase()} connection.`,
        DEVICE_SWITCH_FAILED: (deviceType: string): string =>
            `Failed to switch ${deviceType.toLowerCase()}. Please try again.`,

        // Browser support errors
        BROWSER_NOT_SUPPORTED: (feature: string): string =>
            `${feature} is not supported in this browser.`,
        HTTPS_REQUIRED: (): string =>
            'HTTPS is required for device access. Please use a secure connection.',

        // Generic errors
        INITIALIZATION_FAILED: (componentName: string): string =>
            `Failed to initialize ${componentName}. Please refresh the page and try again.`,
        UNEXPECTED_ERROR: (operation: string): string =>
            `An unexpected error occurred during ${operation}. Please try again.`,
    };

    /**
     * Set an error with a standardized message
     */
    const setError = (errorType: keyof ErrorMessages, ...params: unknown[]): void => {
        const messageFunction = errorMessages[errorType];
        if (messageFunction) {
            error.value = messageFunction(...params);
        } else {
            error.value = String(errorType); // Fallback to the errorType string itself
        }
        hasError.value = true;
        console.error(`${componentName}: ${error.value}`);
    };

    /**
     * Set a custom error message
     */
    const setCustomError = (message: string): void => {
        error.value = message;
        hasError.value = true;
        console.error(`${componentName}: ${message}`);
    };

    /**
     * Handle JavaScript errors and convert them to user-friendly messages
     */
    const handleError = (err: unknown, context: string = 'operation'): void => {
        console.error(`${componentName}: Error in ${context}:`, err);

        if (err instanceof Error) {
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
        } else if (typeof err === 'string') {
            setCustomError(err);
        } else {
            setError('UNEXPECTED_ERROR', context);
        }
    };

    /**
     * Clear current error
     */
    const clearError = (): void => {
        error.value = null;
        hasError.value = false;
    };

    /**
     * Check if error is of a specific type
     */
    const isErrorType = (checkError: string | null, type: keyof ErrorMessages): boolean => {
        if (!checkError) return false;
        const messageFunction = errorMessages[type];
        if (messageFunction) {
            try {
                // Try to match against the message pattern
                const sampleMessage = messageFunction('test');
                const prefix = sampleMessage.split('test')[0];
                return prefix !== undefined && checkError.includes(prefix);
            } catch {
                return checkError.includes(String(type));
            }
        }
        return checkError.includes(String(type));
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
