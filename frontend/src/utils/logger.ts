import pino from 'pino';

const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';

/**
 * Structured logger configuration
 * Uses Pino for fast JSON logging with sensible defaults
 */
const logger = pino({
    level: isProduction ? 'warn' : 'debug',
    browser: {
        asObject: true, // Output as objects for better readability in console
    },
    // Redact sensitive fields from logs
    redact: {
        paths: ['password', 'token', 'apiKey', 'clientSecret', 'authorization', 'csrfToken'],
        remove: true, // Remove the field entirely
    },
    // Add timestamp to all log entries
    timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Sanitize log data to prevent log injection and limit size
 */
export function sanitizeLogData(data: unknown): unknown {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === 'string') {
        // Limit string length to prevent log bloat
        const MAX_STRING_LENGTH = 1000;
        return data.length > MAX_STRING_LENGTH
            ? `${data.substring(0, MAX_STRING_LENGTH)}... [truncated]`
            : data;
    }

    if (Array.isArray(data)) {
        // Limit array size
        const MAX_ARRAY_LENGTH = 50;
        const truncated = data.slice(0, MAX_ARRAY_LENGTH);
        if (data.length > MAX_ARRAY_LENGTH) {
            truncated.push(`... [${data.length - MAX_ARRAY_LENGTH} more items]`);
        }
        return truncated.map(sanitizeLogData);
    }

    if (data && typeof data === 'object') {
        const sanitized: Record<string, unknown> = {};
        const MAX_OBJECT_KEYS = 50;
        let keysProcessed = 0;

        for (const [key, value] of Object.entries(data)) {
            // Skip sensitive keys
            if (
                ['password', 'token', 'secret', 'apiKey', 'clientSecret', 'authorization'].includes(
                    key.toLowerCase()
                )
            ) {
                sanitized[key] = '[REDACTED]';
                continue;
            }

            // Limit number of object keys
            if (keysProcessed >= MAX_OBJECT_KEYS) {
                sanitized._more = `${Object.keys(data).length - MAX_OBJECT_KEYS} more keys omitted`;
                break;
            }

            sanitized[key] = sanitizeLogData(value);
            keysProcessed++;
        }
        return sanitized;
    }

    return data;
}

/**
 * Sanitize a log message string
 */
export function sanitizeLogMessage(message: string): string {
    // Remove potentially dangerous characters that could be used for log injection
    return message.replace(/[\r\n\t%]+/g, ' ');
}

/**
 * Logging levels convenience functions
 */
export const log = {
    /**
     * Debug level logging - only in development
     */
    debug: (message: string, data?: unknown) => {
        if (!isProduction) {
            logger.debug(
                {
                    data: data ? sanitizeLogData(data) : undefined,
                },
                sanitizeLogMessage(message)
            );
        }
    },

    /**
     * Info level logging
     */
    info: (message: string, data?: unknown) => {
        logger.info(
            {
                data: data ? sanitizeLogData(data) : undefined,
            },
            sanitizeLogMessage(message)
        );
    },

    /**
     * Warning level logging
     */
    warn: (message: string, data?: unknown) => {
        logger.warn(
            {
                data: data ? sanitizeLogData(data) : undefined,
            },
            sanitizeLogMessage(message)
        );
    },

    /**
     * Error level logging - always logged
     */
    error: (message: string, error?: unknown) => {
        logger.error(
            {
                error: error ? sanitizeLogData(error) : undefined,
            },
            sanitizeLogMessage(message)
        );
    },

    /**
     * Fatal error logging - highest severity
     */
    fatal: (message: string, error?: unknown) => {
        logger.fatal(
            {
                error: error ? sanitizeLogData(error) : undefined,
            },
            sanitizeLogMessage(message)
        );
    },
};

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>) {
    return logger.child({
        context: sanitizeLogData(context),
    });
}

/**
 * Get the underlying pino logger instance
 * Useful for advanced usage
 */
export function getRawLogger() {
    return logger;
}

export default log;
