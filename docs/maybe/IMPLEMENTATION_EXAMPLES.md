# Device Testing Application - Implementation Examples and Code Snippets

This document provides concrete implementation examples and code snippets for the restructuring and optimization tasks outlined in the main checklist.

## 1. Security - CSP Configuration Fix

### Current Insecure CSP (Backend)
```javascript
// backend/src/server.js - Lines 25-30 (current)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    }
}));
```

### Secure CSP Implementation
```javascript
// backend/src/server.js - Recommended fix
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            reportUri: "/api/csp-violation"
        }
    }
}));

// Add CSP violation reporting endpoint
app.post('/api/csp-violation', (req, res) => {
    console.warn('CSP Violation:', req.body);
    res.status(204).end();
});
```

## 2. Testing Infrastructure Setup

### Frontend Vitest Configuration
```javascript
// frontend/vitest.config.js - Create new file
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/types/**',
                '**/__mocks__/**'
            ]
        },
        setupFiles: ['./tests/setup.js'],
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
});
```

### Test Setup File
```javascript
// frontend/tests/setup.js
import { config } from '@vue/test-utils';
import { expect } from 'vitest';

// Global test configuration
config.global.stubs = {
    Transition: false,
    TransitionGroup: false
};

// Global matchers
expect.extend({
    toBeVueInstance(received) {
        const pass = received && typeof received.$emit === 'function';
        return {
            pass,
            message: () => `Expected ${received} to be a Vue instance`
        };
    }
});
```

### Example Component Test
```javascript
// frontend/src/components/__tests__/WebcamTest.spec.js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WebcamTest from '../WebcamTest.vue';

describe('WebcamTest', () => {
    it('renders correctly', () => {
        const wrapper = mount(WebcamTest);
        expect(wrapper.find('.webcam-test').exists()).toBe(true);
    });

    it('handles permission denied state', async () => {
        const wrapper = mount(WebcamTest);
        
        // Mock navigator.mediaDevices
        const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
        const mockDevices = [{ kind: 'videoinput', label: 'Camera' }];
        
        global.navigator.mediaDevices = {
            getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
            enumerateDevices: vi.fn().mockResolvedValue(mockDevices)
        };

        await wrapper.vm.startTest();
        expect(wrapper.vm.testState).toBe('error');
        expect(wrapper.vm.errorMessage).toContain('Permission denied');
    });
});
```

### Backend Jest Configuration
```javascript
// backend/jest.config.js - Create new file
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/index.js'
    ],
    testMatch: ['**/__tests__/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js']
};
```

### Backend API Test Example
```javascript
// backend/src/__tests__/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
    it('GET /api/health returns 200', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'OK' });
    });

    it('POST /api/test-results validates input', async () => {
        const response = await request(app)
            .post('/api/test-results')
            .send({ invalid: 'data' });
        
        expect(response.status).toBe(400);
    });
});
```

## 3. Docker Optimization

### Multi-stage Dockerfile
```dockerfile
# frontend/Dockerfile - Optimized version
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates (if needed)
# COPY ssl/ /etc/nginx/ssl/

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1
```

### Optimized Nginx Configuration
```nginx
# frontend/nginx.conf - Optimized version
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. Environment Configuration

### Environment Template
```bash
# .env.template
VITE_APP_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:3000
VITE_SENTRY_DSN=
VITE_APP_VERSION=2.0.0
VITE_APP_NAME="Device Testing App"

# Development specific
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# Production specific
# VITE_DEBUG=false
# VITE_LOG_LEVEL=error
```

### Environment Loader
```javascript
// frontend/src/utils/env.js
export const getEnv = (key, defaultValue = '') => {
    const value = import.meta.env[key];
    
    if (value === undefined || value === '') {
        if (defaultValue === undefined) {
            throw new Error(`Environment variable ${key} is required`);
        }
        return defaultValue;
    }
    
    return value;
};

export const config = {
    environment: getEnv('VITE_APP_ENVIRONMENT', 'development'),
    apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:3000'),
    debug: getEnv('VITE_DEBUG', 'false') === 'true',
    logLevel: getEnv('VITE_LOG_LEVEL', 'info'),
    sentryDsn: getEnv('VITE_SENTRY_DSN', '')
};
```

## 5. Error Handling Standardization

### Error Handling Composable
```typescript
// frontend/src/composables/useErrorHandler.ts
import { ref } from 'vue';
import type { Ref } from 'vue';

export interface AppError {
    id: string;
    message: string;
    code?: string;
    context?: string;
    timestamp: Date;
    stack?: string;
}

export const useErrorHandler = () => {
    const errors: Ref<AppError[]> = ref([]);
    const currentError: Ref<AppError | null> = ref(null);

    const handleError = (error: unknown, context: string = 'unknown'): AppError => {
        const errorId = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date();
        
        let appError: AppError;
        
        if (error instanceof Error) {
            appError = {
                id: errorId,
                message: error.message,
                code: (error as any).code,
                context,
                timestamp,
                stack: error.stack
            };
        } else if (typeof error === 'string') {
            appError = {
                id: errorId,
                message: error,
                context,
                timestamp
            };
        } else {
            appError = {
                id: errorId,
                message: 'Unknown error occurred',
                context,
                timestamp
            };
        }

        errors.value.push(appError);
        currentError.value = appError;

        // Report to error tracking service
        if (import.meta.env.VITE_SENTRY_DSN) {
            // Sentry.captureException(error, { tags: { context } });
        }

        console.error(`[${context}] Error:`, error);
        return appError;
    };

    const clearError = (errorId?: string) => {
        if (errorId) {
            errors.value = errors.value.filter(e => e.id !== errorId);
            if (currentError.value?.id === errorId) {
                currentError.value = null;
            }
        } else {
            errors.value = [];
            currentError.value = null;
        }
    };

    return {
        errors,
        currentError,
        handleError,
        clearError
    };
};
```

### Global Error Handler
```javascript
// frontend/src/utils/globalErrorHandler.js
export const setupGlobalErrorHandling = (app) => {
    // Vue error handler
    app.config.errorHandler = (error, instance, info) => {
        console.error('Vue Error:', error, 'Component:', instance, 'Info:', info);
        
        // Report to error tracking service
        if (window.Sentry) {
            window.Sentry.captureException(error, {
                extra: { component: instance?.$options.name, info }
            });
        }
    };

    // Window error handler
    window.addEventListener('error', (event) => {
        console.error('Global Error:', event.error);
        
        if (window.Sentry) {
            window.Sentry.captureException(event.error);
        }
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        
        if (window.Sentry) {
            window.Sentry.captureException(event.reason);
        }
        
        event.preventDefault();
    });
};
```

## 6. Performance Monitoring

### Web Vitals Integration
```javascript
// frontend/src/utils/performance.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const trackPerformance = () => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
};

export const measureComponentPerformance = (componentName) => {
    const start = performance.now();
    
    return {
        end: () => {
            const duration = performance.now() - start;
            console.log(`⏱️ ${componentName} rendered in ${duration.toFixed(2)}ms`);
            
            // Send to analytics
            if (window.gtag) {
                window.gtag('event', 'component_render', {
                    component_name: componentName,
                    duration_ms: Math.round(duration)
                });
            }
            
            return duration;
        }
    };
};
```

### Custom Performance Metrics
```javascript
// frontend/src/composables/usePerformance.ts
import { ref, onMounted, onUnmounted } from 'vue';

export interface PerformanceMetrics {
    memoryUsage: number;
    loadTime: number;
    interactionTime: number;
    frameRate: number;
}

export const usePerformance = () => {
    const metrics = ref<PerformanceMetrics>({
        memoryUsage: 0,
        loadTime: 0,
        interactionTime: 0,
        frameRate: 0
    });

    let frameCount = 0;
    let lastFrameTime = 0;
    let animationFrameId: number;

    const measureFrameRate = () => {
        const now = performance.now();
        frameCount++;
        
        if (now - lastFrameTime >= 1000) {
            metrics.value.frameRate = frameCount;
            frameCount = 0;
            lastFrameTime = now;
        }
        
        animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    const measureMemory = () => {
        if ('memory' in performance) {
            metrics.value.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
    };

    onMounted(() => {
        metrics.value.loadTime = performance.now();
        measureFrameRate();
        
        // Measure memory every 5 seconds
        const memoryInterval = setInterval(measureMemory, 5000);
        
        onUnmounted(() => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(memoryInterval);
        });
    });

    return {
        metrics,
        recordInteraction: () => {
            metrics.value.interactionTime = performance.now();
        }
    };
};
```

## 7. TypeScript Migration Examples

### JavaScript to TypeScript Conversion
```typescript
// Before: frontend/src/composables/useDeviceTest.js
export const useDeviceTest = () => {
    const testState = ref('idle');
    const testResults = ref([]);
    
    const startTest = async () => {
        // implementation
    };
    
    return { testState, testResults, startTest };
};

// After: frontend/src/composables/useDeviceTest.ts
import { ref, Ref } from 'vue';

export interface TestResult {
    success: boolean;
    data: any;
    error?: string;
    timestamp: Date;
}

export type TestState = 'idle' | 'running' | 'completed' | 'error';

export const useDeviceTest = () => {
    const testState: Ref<TestState> = ref('idle');
    const testResults: Ref<TestResult[]> = ref([]);
    
    const startTest = async (): Promise<void> => {
        try {
            testState.value = 'running';
            // implementation
            testState.value = 'completed';
        } catch (error) {
            testState.value = 'error';
            throw error;
        }
    };
    
    return { testState, testResults, startTest };
};
```

These examples provide concrete implementation guidance for the optimization tasks. Each snippet includes best practices and follows modern JavaScript/TypeScript patterns.