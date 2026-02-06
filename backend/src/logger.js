const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !isProduction;

/**
 * Custom format for log entries
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'isoDateTime' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ' ' + JSON.stringify(meta, null, 2);
        }
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

/**
 * Sanitize log data to redact sensitive fields
 */
function sanitizeData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sensitiveKeys = [
        'password',
        'pwd',
        'token',
        'apiKey',
        'secret',
        'clientSecret',
        'authorization',
        'csrfToken',
        '_csrf',
        'session',
        'cookie',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    if (Array.isArray(sanitized)) {
        return sanitized.map(item => sanitizeData(item));
    }

    for (const key in sanitized) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
        } else if (sanitized[key] && typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    }

    return sanitized;
}

/**
 * Sanitize middleware for winston
 */
const sanitizeTransform = winston.format(info => {
    if (info.data) {
        info.data = sanitizeData(info.data);
    }
    if (info.error) {
        if (typeof info.error === 'object') {
            info.error = sanitizeData(info.error);
        }
    }
    // Sanitize any other object properties
    for (const key in info) {
        if (['level', 'message', 'timestamp'].includes(key)) continue;
        if (info[key] && typeof info[key] === 'object') {
            info[key] = sanitizeData(info[key]);
        }
    }
    return info;
})();

/**
 * Create logger instance
 */
const logger = winston.createLogger({
    level: isProduction ? 'warn' : 'debug',
    format: winston.format.combine(sanitizeTransform, customFormat),
    defaultMeta: {
        service: 'mmit-testing-backend',
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
    },
    transports: [
        // Write to console in development
        new winston.transports.Console({
            format: isDevelopment ? consoleFormat : customFormat,
            level: isDevelopment ? 'debug' : 'warn',
        }),
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});

// Add file transports in production
if (isProduction) {
    logger.add(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
    logger.add(
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        })
    );
}

/**
 * Convenience methods for each log level
 */
logger.debugLog = (message, context = {}) => {
    logger.debug(message, { data: context });
};

logger.requestLog = (message, context = {}) => {
    logger.info(message, context);
};

logger.errorLog = (message, error = null, context = {}) => {
    if (error) {
        logger.error(message, { error, data: context });
    } else {
        logger.error(message, context);
    }
};

module.exports = logger;
