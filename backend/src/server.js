const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
        status: 'OK',
        message: 'MMITLab Testing App Backend is running',
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
        success: true,
        message: 'Test results saved successfully',
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
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});

app.listen(PORT, () => {
    console.log(`🚀 MMITLab Testing App Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
