const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const os = require('os');
const i18n = require('./i18n');

// Debug logging helper
const debugLog = (message, context = {}) => {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || 'development';
  const pid = process.pid;
  
  console.log(`[${timestamp}] [PID:${pid}] [${env}] DEBUG: ${message}`, context);
};

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.npm_package_version || '1.0.0';

// Server startup debug logging
debugLog('Server initialization started', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  memory: process.memoryUsage()
});

// Environment variable debug logging
debugLog('Environment variables check', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  PORT_AVAILABLE: !!process.env.PORT,
  NODE_ENV_AVAILABLE: !!process.env.NODE_ENV
});

// Enhanced language detection middleware
app.use((req, res, next) => {
  const detectedLocale = i18n.detectLanguage(req);
  i18n.setLocale(detectedLocale);
  
  // Add language info to request for logging
  req.locale = detectedLocale;
  next();
});

// i18n middleware
app.use(i18n.init);

// Enhanced middleware with i18n support
// Configure helmet with CSP that allows Vue to work properly
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "http:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      mediaSrc: ["'self'", "mediastream:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "http:", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    }
  }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with i18n
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(i18n.__('server.logs.requestProcessed', {
      method: req.method,
      path: req.path,
      time: duration,
      status: res.statusCode,
      locale: req.locale
    }));
  });
  next();
});

// Serve static files from frontend build (for production)
debugLog('Checking static file serving configuration');
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../frontend/dist');
  debugLog('Production mode detected - configuring static file serving', {
    staticPath,
    pathExists: require('fs').existsSync(staticPath)
  });
  app.use(express.static(staticPath));
} else {
  debugLog('Development mode - static file serving disabled');
}

// API Routes with enhanced i18n support
debugLog('Setting up API routes');

// Health endpoint with comprehensive information
app.get('/api/health', (req, res) => {
  debugLog('Health endpoint accessed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    headers: req.headers
  });
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: req.t('api.health.status'),
    message: req.t('api.health.message'),
    version: req.t('api.health.version', { version: VERSION }),
    uptime: req.t('api.health.uptime', { uptime: uptime.toFixed(2) }),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    },
    process: {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      uptime: process.uptime(),
      pid: process.pid
    }
  });
});

// Welcome endpoint
app.get('/api', (req, res) => {
  debugLog('API welcome endpoint accessed', {
    method: req.method,
    path: req.path
  });
  res.json({
    message: req.t('api.messages.welcome'),
    documentation: req.t('api.messages.documentation', {
      url: `http://localhost:${PORT}/api/health`
    }),
    version: VERSION,
    timestamp: new Date().toISOString()
  });
});

// Enhanced test results endpoint with validation and i18n
app.post('/api/test-results', (req, res) => {
  debugLog('Test results endpoint accessed', {
    method: req.method,
    path: req.path,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  const { testResults, deviceInfo } = req.body;

  // Validation
  if (!testResults || !Array.isArray(testResults)) {
    return res.status(400).json({
      error: req.t('api.errors.validation.invalidData'),
      message: req.t('api.errors.validation.missingRequired', { fields: 'testResults (array)' }),
      code: 'VALIDATION_ERROR'
    });
  }

  // Log with enhanced i18n support
  console.log(i18n.__('server.logs.testResultsReceived', {
    count: testResults.length,
    device: deviceInfo?.deviceName || 'unknown device',
    timestamp: new Date().toISOString()
  }));

  // Simulate processing
  console.log(req.t('api.testResults.processing'));

  // Here you could save test results to a database
  // For now, we'll just log them and return success
  console.log('Detailed Test Results:', {
    timestamp: new Date().toISOString(),
    totalTests: testResults.length,
    results: testResults.map(result => ({
      testType: result.testType,
      status: result.status,
      duration: result.duration
    }))
  });

  res.json({
    success: req.t('api.testResults.success'),
    message: req.t('api.testResults.message'),
    details: req.t('api.testResults.received', { count: testResults.length }),
    timestamp: new Date().toISOString(),
    processedCount: testResults.length
  });
});

// Enhanced system information endpoint
app.get('/api/system-info', (req, res) => {
  debugLog('System info endpoint accessed', {
    method: req.method,
    path: req.path
  });
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
    networkInterfaces: os.networkInterfaces(),
    userInfo: os.userInfo()
  };

  res.json({
    ...systemInfo,
    message: req.t('api.success.retrieved'),
    timestamp: new Date().toISOString()
  });
});

// Validation example endpoint
app.post('/api/validate', (req, res) => {
  debugLog('Validation endpoint accessed', {
    method: req.method,
    path: req.path,
    contentType: req.get('Content-Type')
  });
  const { email, password, age } = req.body;
  const errors = [];

  // Email validation
  if (!email) {
    errors.push(req.t('validation.required.field', { field: 'email' }));
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(req.t('validation.format.email'));
  }

  // Password validation
  if (!password) {
    errors.push(req.t('validation.required.field', { field: 'password' }));
  } else if (password.length < 8) {
    errors.push(req.t('validation.length.min', { min: 8 }));
  }

  // Age validation
  if (age && (age < 18 || age > 120)) {
    errors.push(req.t('validation.value.between', { min: 18, max: 120 }));
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: req.t('api.errors.validation.invalidData'),
      message: req.t('api.errors.validation.missingRequired', { fields: errors.join(', ') }),
      details: errors,
      code: 'VALIDATION_ERROR'
    });
  }

  res.json({
    success: true,
    message: req.t('validation.success'),
    timestamp: new Date().toISOString()
  });
});

// Catch all handler for production (serve frontend)
debugLog('Setting up catch-all handler for production');
if (process.env.NODE_ENV === 'production') {
  const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
  debugLog('Production catch-all handler configured', {
    indexPath,
    fileExists: require('fs').existsSync(indexPath)
  });
  app.get('*', (req, res) => {
    debugLog('Catch-all route triggered', {
      originalUrl: req.originalUrl,
      path: req.path,
      method: req.method
    });
    res.sendFile(indexPath);
  });
} else {
  debugLog('Development mode - catch-all handler disabled');
}

// Enhanced error handling middleware with i18n
app.use((err, req, res, _next) => {
  debugLog('ERROR HANDLER TRIGGERED - Unhandled exception', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  
  console.error(i18n.__('server.logs.errorOccurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  }));

  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: req.t('api.errors.serverError.error'),
    message: isDevelopment ? err.message : req.t('api.errors.serverError.message'),
    internalMessage: isDevelopment ? err.stack : req.t('api.errors.serverError.internalMessage'),
    contact: req.t('api.errors.serverError.contactSupport'),
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

// Enhanced 404 handler with i18n
app.use((req, res) => {
  debugLog('404 HANDLER TRIGGERED - Route not found', {
    path: req.path,
    method: req.method,
    originalUrl: req.originalUrl,
    query: req.query,
    headers: req.headers
  });
  
  console.log(i18n.__('api.errors.notFound.resource', { resource: req.path }));
  
  res.status(404).json({
    error: req.t('api.errors.notFound.error'),
    message: req.t('api.errors.notFound.message'),
    details: req.t('api.errors.notFound.endpoint', { endpoint: req.path }),
    timestamp: new Date().toISOString(),
    suggestion: req.t('api.messages.documentation', { url: `http://localhost:${PORT}/api/health` })
  });
});

// Enhanced server startup with comprehensive i18n logging
debugLog('Starting server listener on port', { port: PORT });
app.listen(PORT, () => {
  debugLog('SERVER STARTUP COMPLETE - Server is now listening', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length
  });
  
  console.log(i18n.__('server.startup.initializing'));
  console.log(i18n.__('server.startup.running', { port: PORT }));
  console.log(i18n.__('server.startup.healthCheck', { port: PORT }));
  console.log(i18n.__('server.startup.environment', { env: process.env.NODE_ENV || 'development' }));
  console.log(i18n.__('server.startup.ready'));
  
  // Log system information
  const memoryUsage = process.memoryUsage();
  console.log(i18n.__('system.metrics.memoryUsage', {
    usage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
  }));
});

// Handle server startup errors
app.on('error', (error) => {
  debugLog('SERVER STARTUP ERROR - Failed to start', {
    error: error.message,
    code: error.code,
    port: PORT,
    syscall: error.syscall,
    stack: error.stack
  });
  
  if (error.code === 'EADDRINUSE') {
    debugLog('PORT ALREADY IN USE - Cannot bind to port', {
      port: PORT,
      alternativePort: parseInt(PORT) + 1
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  debugLog('UNCAUGHT EXCEPTION - Process will exit', {
    error: error.message,
    stack: error.stack,
    code: error.code
  });
  
  // Log the fatal error
  console.error('FATAL ERROR - Uncaught Exception:', error.message);
  console.error(error.stack);
  
  // Throw the error to be handled by the error handling middleware
  // This allows proper cleanup and graceful shutdown
  throw error;
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  debugLog('UNHANDLED REJECTION - Promise rejection not handled', {
    reason: reason instanceof Error ? reason.message : reason,
    promise
  });
});
