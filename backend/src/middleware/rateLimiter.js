const rateLimit = require('express-rate-limit');
const logger = require('../logger');

/**
 * Rate limiter for general API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the request limit. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the request limit. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
        });
    },
    skip: req => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
    },
});

/**
 * Rate limiter for test submission endpoints
 * Limits: 10 requests per 1 minute per IP
 */
const testLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 test submissions per minute
    message: {
        error: 'Test submission rate limit exceeded',
        message: 'You can only submit 10 test results per minute. Please slow down.',
        code: 'TEST_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Test submission rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            error: 'Test submission rate limit exceeded',
            message: 'You can only submit 10 test results per minute. Please slow down.',
            code: 'TEST_RATE_LIMIT_EXCEEDED',
            retryAfter: '1 minute',
        });
    },
});

/**
 * Rate limiter for validation endpoints
 * Limits: 20 requests per 1 minute per IP
 */
const validationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 validations per minute
    message: {
        error: 'Validation rate limit exceeded',
        message: 'Too many validation requests. Please try again later.',
        code: 'VALIDATION_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Validation rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            error: 'Validation rate limit exceeded',
            message: 'Too many validation requests. Please try again later.',
            code: 'VALIDATION_RATE_LIMIT_EXCEEDED',
            retryAfter: '1 minute',
        });
    },
});

module.exports = {
    apiLimiter,
    testLimiter,
    validationLimiter,
};
