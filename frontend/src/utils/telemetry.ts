/**
 * Telemetry service for error reporting and performance monitoring (RUM).
 * Sends data to a configurable endpoint if VITE_TELEMETRY_ENDPOINT is defined.
 */

export interface TelemetryEvent {
    type: 'error' | 'performance' | 'log';
    timestamp: number;
    data: Record<string, unknown>;
}

const getEndpoint = (): string | null => {
    return import.meta.env?.VITE_TELEMETRY_ENDPOINT ?? null;
};

/**
 * Send a telemetry event using sendBeacon or fallback fetch.
 */
export function sendTelemetry(event: TelemetryEvent): void {
    const endpoint = getEndpoint();
    if (!endpoint) return;

    const payload = JSON.stringify(event);

    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
    } else {
        // Fallback: use fetch with keepalive if available
        void fetch(endpoint, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(() => {
            // Silently fail – telemetry should not break user experience
        });
    }
}

/**
 * Report a client-side error.
 */
export function reportError(error: Error | string, context?: string): void {
    const event: TelemetryEvent = {
        type: 'error',
        timestamp: Date.now(),
        data: {
            message: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'string' ? undefined : error.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
        },
    };
    sendTelemetry(event);
}

/**
 * Report performance metrics collected from the Performance API.
 */
export function reportPerformance(metrics: {
    loadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    firstByte?: number;
    requestTime?: number;
    memoryUsage?: number;
}): void {
    const event: TelemetryEvent = {
        type: 'performance',
        timestamp: Date.now(),
        data: {
            ...metrics,
            url: window.location.pathname,
        },
    };
    sendTelemetry(event);
}

/**
 * Report a generic log message (e.g., user action).
 */
export function reportLog(message: string, properties?: Record<string, unknown>): void {
    const event: TelemetryEvent = {
        type: 'log',
        timestamp: Date.now(),
        data: {
            message,
            ...properties,
        },
    };
    sendTelemetry(event);
}

/**
 * Install global error listeners for unhandled errors and unhandled promise rejections.
 */
export function installGlobalErrorHandlers(): void {
    window.addEventListener('error', event => {
        reportError(
            event.message,
            `filename: ${event.filename}, line: ${event.lineno}, col: ${event.colno}`
        );
    });

    window.addEventListener('unhandledrejection', event => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        reportError(message, 'unhandledrejection');
    });
}
