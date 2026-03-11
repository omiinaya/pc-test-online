import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    sendTelemetry,
    reportError,
    reportPerformance,
    reportLog,
    installGlobalErrorHandlers,
    installPerformanceReporter,
} from '../telemetry';

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn(() => true);
const mockFetch = vi.fn(() => Promise.resolve());

describe('Telemetry Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_TELEMETRY_ENDPOINT', 'https://telemetry.example.com/collect');
        global.navigator = { sendBeacon: mockSendBeacon } as unknown as Navigator;
        global.fetch = mockFetch;
    });

    afterEach(() => {
        // Restore environment stubs
        if (typeof vi.unstubAllEnvs === 'function') {
            vi.unstubAllEnvs();
        }
    });

    describe('sendTelemetry', () => {
        it('should send event via sendBeacon when available', () => {
            const event = { type: 'error', timestamp: Date.now(), data: { msg: 'test' } };
            sendTelemetry(event);
            expect(mockSendBeacon).toHaveBeenCalledWith(
                'https://telemetry.example.com/collect',
                expect.any(Blob)
            );
        });

        it('should fallback to fetch if sendBeacon not available', () => {
            const originalSendBeacon = global.navigator.sendBeacon;
            Reflect.deleteProperty(global.navigator, 'sendBeacon');

            const event = { type: 'log', timestamp: Date.now(), data: { message: 'hi' } };
            sendTelemetry(event);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://telemetry.example.com/collect',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(String),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                })
            );

            (global.navigator as Navigator).sendBeacon = originalSendBeacon;
        });

        it('should not send if no endpoint configured', () => {
            vi.stubEnv('VITE_TELEMETRY_ENDPOINT', '');
            const event = { type: 'performance', timestamp: Date.now(), data: {} };
            sendTelemetry(event);
            expect(mockSendBeacon).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('reportError', () => {
        it('should send error event via sendBeacon', () => {
            reportError('Something broke', 'context');
            expect(mockSendBeacon).toHaveBeenCalled();
        });
    });

    describe('reportPerformance', () => {
        it('should send performance metrics', () => {
            reportPerformance({ loadTime: 100 });
            expect(mockSendBeacon).toHaveBeenCalled();
        });
    });

    describe('reportLog', () => {
        it('should send log event', () => {
            reportLog('Message', { key: 'value' });
            expect(mockSendBeacon).toHaveBeenCalled();
        });
    });

    describe('installGlobalErrorHandlers', () => {
        it('should add event listeners for error and unhandledrejection', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            installGlobalErrorHandlers();
            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });

        it('should send telemetry when error event occurs', () => {
            installGlobalErrorHandlers();

            const errorEvent = new ErrorEvent('error', {
                message: 'Test error',
                filename: 'test.js',
                lineno: 10,
                colno: 5,
            });
            window.dispatchEvent(errorEvent);

            expect(mockSendBeacon).toHaveBeenCalledWith(
                'https://telemetry.example.com/collect',
                expect.any(Blob)
            );
        });

        it('should send telemetry for unhandledrejection', () => {
            installGlobalErrorHandlers();

            const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
                reason: 'Promise failed',
                promise: Promise.reject('oops'),
            });
            window.dispatchEvent(rejectionEvent);

            expect(mockSendBeacon).toHaveBeenCalled();
        });
    });

    describe('installPerformanceReporter', () => {
        it('should add pagehide and visibilitychange listeners', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            installPerformanceReporter({ loadTime: 100 });
            expect(addEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });

        it('should send performance report on visibilitychange to hidden', () => {
            installPerformanceReporter({ loadTime: 100 });

            // Simulate hidden
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
            window.dispatchEvent(new Event('visibilitychange'));

            expect(mockSendBeacon).toHaveBeenCalledWith(
                'https://telemetry.example.com/collect',
                expect.any(Blob)
            );
        });
    });
});
