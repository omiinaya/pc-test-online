const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const i18n = require('./i18n');

const app = express();
const PORT = process.env.PORT || 3000;

// Language detection middleware
app.use((req, res, next) => {
  const detectedLocale = i18n.detectLanguage(req);
  i18n.setLocale(detectedLocale);
  next();
});

// i18n middleware
app.use(i18n.init);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: req.t('api.health.status'),
        message: req.t('api.health.message'),
        timestamp: new Date().toISOString(),
    });
});

// Test results endpoint (for future use)
app.post('/api/test-results', (req, res) => {
    const { testResults } = req.body;

    // Here you could save test results to a database
    // For now, we'll just log them and return success
    console.log('Test Results Received:', {
        timestamp: new Date().toISOString(),
        results: testResults,
    });

    res.json({
        success: req.t('api.testResults.success'),
        message: req.t('api.testResults.message'),
        timestamp: new Date().toISOString(),
    });
});

// Get system information (for future use)
app.get('/api/system-info', (req, res) => {
    const os = require('os');

    res.json({
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime(),
    });
});

// Catch all handler for production (serve frontend)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: req.t('api.errors.serverError.error'),
        message: process.env.NODE_ENV === 'development' ? err.message : req.t('api.errors.serverError.internalMessage'),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: req.t('api.errors.notFound.error'),
        message: req.t('api.errors.notFound.message'),
    });
});

app.listen(PORT, () => {
    console.log(i18n.__('server.startup.running', { port: PORT }));
    console.log(i18n.__('server.startup.healthCheck', { port: PORT }));
    console.log(i18n.__('server.startup.environment', { env: process.env.NODE_ENV || 'development' }));
});
