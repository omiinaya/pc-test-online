import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorHandling } from '../useErrorHandling';

describe('useErrorHandling', () => {
    const componentName = 'TestComponent';
    let errorHandling: ReturnType<typeof useErrorHandling>;

    beforeEach(() => {
        errorHandling = useErrorHandling(componentName);
    });

    describe('initial state', () => {
        it('should initialize with no error', () => {
            expect(errorHandling.error.value).toBeNull();
        });

        it('should initialize with hasError false', () => {
            expect(errorHandling.hasError.value).toBe(false);
        });
    });

    describe('setError', () => {
        it('should set error with PERMISSION_DENIED message', () => {
            errorHandling.setError('PERMISSION_DENIED', 'microphone');
            expect(errorHandling.error.value).toBe(
                'microphone access was denied. Please enable microphone permissions in your browser settings.'
            );
            expect(errorHandling.hasError.value).toBe(true);
        });

        it('should set error with DEVICE_NOT_FOUND message', () => {
            errorHandling.setError('DEVICE_NOT_FOUND', 'camera');
            expect(errorHandling.error.value).toBe('No camera devices found on your system.');
        });

        it('should set error with BROWSER_NOT_SUPPORTED message', () => {
            errorHandling.setError('BROWSER_NOT_SUPPORTED', 'MediaDevices');
            expect(errorHandling.error.value).toBe(
                'MediaDevices is not supported in this browser.'
            );
        });

        it('should set error with UNEXPECTED_ERROR message', () => {
            errorHandling.setError('UNEXPECTED_ERROR', 'initialization');
            expect(errorHandling.error.value).toBe(
                'An unexpected error occurred during initialization. Please try again.'
            );
        });

        it('should fallback to string if unknown error type', () => {
            // @ts-expect-error testing unknown error type
            errorHandling.setError('UNKNOWN_ERROR');
            expect(errorHandling.error.value).toBe('UNKNOWN_ERROR');
        });

        it('should handle parameters for error messages with multiple args', () => {
            errorHandling.setError('INITIALIZATION_FAILED', 'MyComponent');
            expect(errorHandling.error.value).toBe(
                'Failed to initialize MyComponent. Please refresh the page and try again.'
            );
        });
    });

    describe('setCustomError', () => {
        it('should set a custom error message', () => {
            errorHandling.setCustomError('Custom failure message');
            expect(errorHandling.error.value).toBe('Custom failure message');
            expect(errorHandling.hasError.value).toBe(true);
        });
    });

    describe('handleError', () => {
        it('should handle known error names and set appropriate message', () => {
            const notAllowedError = new Error('User denied');
            (notAllowedError as any).name = 'NotAllowedError';
            errorHandling.handleError(notAllowedError, 'microphone');
            expect(errorHandling.error.value).toBe(
                'microphone access was denied. Please enable microphone permissions in your browser settings.'
            );
        });

        it('should handle NotFoundError', () => {
            const notFoundError = new Error('No device');
            (notFoundError as any).name = 'NotFoundError';
            errorHandling.handleError(notFoundError, 'camera');
            expect(errorHandling.error.value).toBe('No camera devices found on your system.');
        });

        it('should fallback to UNEXPECTED_ERROR for unknown errors', () => {
            const unknownErr = new Error('Something weird');
            errorHandling.handleError(unknownErr, 'test');
            expect(errorHandling.error.value).toBe(
                'An unexpected error occurred during test. Please try again.'
            );
        });

        it('should set custom error when error is a string', () => {
            errorHandling.handleError('some string', 'operation');
            expect(errorHandling.error.value).toBe('some string');
        });

        it('should set UNEXPECTED_ERROR for non-Error, non-string objects', () => {
            // @ts-expect-error passing a plain object
            errorHandling.handleError({ some: 'object' }, 'operation');
            expect(errorHandling.error.value).toBe(
                'An unexpected error occurred during operation. Please try again.'
            );
        });

        it('should handle NotFoundError', () => {
            const notFoundError = new Error('No device');
            (notFoundError as any).name = 'NotFoundError';
            errorHandling.handleError(notFoundError, 'camera');
            expect(errorHandling.error.value).toBe('No camera devices found on your system.');
        });

        it('should fallback to UNEXPECTED_ERROR for unknown errors', () => {
            const unknownErr = new Error('Something weird');
            errorHandling.handleError(unknownErr, 'test');
            expect(errorHandling.error.value).toBe(
                'An unexpected error occurred during test. Please try again.'
            );
        });

        it('should set UNEXPECTED_ERROR for non-Error, non-string objects', () => {
            // @ts-expect-error passing a plain object
            errorHandling.handleError({ some: 'object' }, 'operation');
            expect(errorHandling.error.value).toBe(
                'An unexpected error occurred during operation. Please try again.'
            );
        });
    });

    describe('clearError', () => {
        it('should clear the error', () => {
            errorHandling.setError('PERMISSION_DENIED', 'microphone');
            errorHandling.clearError();
            expect(errorHandling.error.value).toBeNull();
            expect(errorHandling.hasError.value).toBe(false);
        });
    });

    describe('isErrorType', () => {
        it('should return true for HTTPS_REQUIRED when error is HTTPS_REQUIRED', () => {
            errorHandling.setError('HTTPS_REQUIRED');
            expect(errorHandling.isErrorType(errorHandling.error.value, 'HTTPS_REQUIRED')).toBe(
                true
            );
        });

        it('should return false for HTTPS_REQUIRED when error is DEVICE_NOT_FOUND', () => {
            errorHandling.setError('DEVICE_NOT_FOUND', 'camera');
            expect(errorHandling.isErrorType(errorHandling.error.value, 'HTTPS_REQUIRED')).toBe(
                false
            );
        });

        it('should return false if error is null', () => {
            expect(errorHandling.isErrorType(null, 'HTTPS_REQUIRED')).toBe(false);
        });
    });
});
