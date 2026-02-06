const { body, param, validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 */
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'The request contains invalid data',
            details: errors.array(),
            code: 'VALIDATION_ERROR',
        });
    }
    next();
};

/**
 * Test result validation
 */
exports.validateTestResult = [
    body('testType')
        .isIn([
            'camera',
            'microphone',
            'speaker',
            'screen',
            'keyboard',
            'mouse',
            'touch',
            'battery',
        ])
        .withMessage('Invalid test type'),
    body('status').isIn(['passed', 'failed', 'pending', 'skipped']).withMessage('Invalid status'),
    body('duration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration must be a positive integer'),
    body('deviceId').optional().isString().withMessage('deviceId must be a string'),
    exports.handleValidationErrors,
];

/**
 * Validate request validation
 */
exports.validateValidateRequest = [
    body('testType')
        .isIn([
            'camera',
            'microphone',
            'speaker',
            'screen',
            'keyboard',
            'mouse',
            'touch',
            'battery',
        ])
        .withMessage('Invalid test type'),
    body('deviceId').optional().isString().withMessage('deviceId must be a string'),
    exports.handleValidationErrors,
];

/**
 * Param validation for test type
 */
exports.validateTestTypeParam = [
    param('testType')
        .isIn([
            'camera',
            'microphone',
            'speaker',
            'screen',
            'keyboard',
            'mouse',
            'touch',
            'battery',
        ])
        .withMessage('Invalid test type parameter'),
    exports.handleValidationErrors,
];
