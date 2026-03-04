# Security Code Smells Remediation Attack Plan

**Project:** mmit-testing-app  
**Total Findings:** 27  
**Target Completion:** 2-3 weeks  
**Priority:** Security-critical issues first

---

## Phase 1: Critical Infrastructure (Week 1)

**Goal:** Address HIGH and MEDIUM severity findings that pose immediate security risks **Effort:**
2-3 days  
**Risk Reduction:** ~60%

### 1.1 Container Security - HIGH Priority

**File:** `frontend/Dockerfile:31` **Issue:** Container runs as root user **Effort:** 30 minutes

**Tasks:**

- [ ] Add non-root user creation to Dockerfile
- [ ] Test container builds and runs correctly
- [ ] Verify file permissions work with new user
- [ ] Update docker-compose if needed

**Implementation:**

```dockerfile
# Add before CMD
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs
CMD ["nginx", "-g", "daemon off;"]
```

**Testing:**

```bash
docker build -t mmit-testing-frontend .
docker run --rm mmit-testing-frontend id  # Should show non-root user
docker run --rm mmit-testing-frontend ps aux  # Verify nginx not running as root
```

---

### 1.2 CSRF Protection - MEDIUM Priority

**File:** `backend/src/server.js:18` **Issue:** Express app missing CSRF middleware **Effort:** 2-4
hours

**Tasks:**

- [ ] Install csurf and cookie-parser dependencies
- [ ] Configure CSRF middleware
- [ ] Add CSRF token to frontend requests
- [ ] Implement CSRF error handler
- [ ] Test all API endpoints still work
- [ ] Update API documentation

**Implementation:**

```bash
cd backend
npm install csurf cookie-parser
```

```javascript
// backend/src/server.js
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// Add after express initialization
app.use(cookieParser());
app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })
);

// CSRF token endpoint for frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form submission failed validation',
    });
  }
  next(err);
});
```

**Frontend Updates:**

```typescript
// Add to API client
async function fetchWithCSRF(url: string, options: RequestInit = {}) {
  const csrfToken = await getCSRFToken(); // Fetch from /api/csrf-token
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
  });
}
```

**Testing:**

- [ ] Verify POST/PUT/DELETE requests include CSRF token
- [ ] Verify requests without token return 403
- [ ] Test token regeneration after session expiry

---

### 1.3 Subresource Integrity - MEDIUM Priority

**File:** `frontend/index.html:20-21` **Issue:** Google AdSense script lacks integrity attribute
**Effort:** 1-2 hours

**Tasks:**

- [ ] Calculate SRI hash for external script
- [ ] Add integrity attribute
- [ ] Test script still loads correctly
- [ ] Document SRI update process

**Note:** Google AdSense scripts change frequently, so this requires ongoing maintenance.

**Option A - Add SRI (if script is stable):**

```bash
# Generate SRI hash
curl -s https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440039437221216"
  integrity="sha384-[GENERATED_HASH]"
  crossorigin="anonymous"
></script>
```

**Option B - Self-host (Recommended for stability):**

```bash
# Download and self-host
wget https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js -O frontend/public/adsbygoogle.js
```

```html
<script async src="/adsbygoogle.js" data-client="ca-pub-1440039437221216"></script>
```

**Testing:**

- [ ] Verify ads load correctly
- [ ] Check browser console for integrity errors
- [ ] Test with ad-blocker disabled

---

## Phase 2: Input Validation & ReDoS (Week 1-2)

**Goal:** Fix ReDoS vulnerabilities and improve input validation  
**Effort:** 1-2 days  
**Risk Reduction:** ~15%

### 2.1 ReDoS Prevention

**Files:**

- `frontend/src/composables/useStatePanelConfigs.ts:158,160`
- `frontend/src/composables/utils/useStatePanelConfigs.ts:155,157`

**Issue:** Dynamic RegExp creation with user-controlled input **Effort:** 3-4 hours

**Tasks:**

- [ ] Create device type whitelist/enum
- [ ] Implement regex escaping function
- [ ] Add input validation
- [ ] Add unit tests
- [ ] Update TypeScript types

**Implementation:**

```typescript
// frontend/src/types/device.ts
export const ALLOWED_DEVICE_TYPES = ['camera', 'microphone', 'speaker', 'screen'] as const;

export type DeviceType = (typeof ALLOWED_DEVICE_TYPES)[number];

export function isValidDeviceType(type: string): type is DeviceType {
  return ALLOWED_DEVICE_TYPES.includes(type as DeviceType);
}
```

```typescript
// frontend/src/utils/regex.ts
/**
 * Escapes special regex characters to prevent ReDoS
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a safe regex from device type with validation
 */
export function createDeviceTypeRegex(deviceType: string, flags: string = 'gi'): RegExp | null {
  // Validate against whitelist
  if (!isValidDeviceType(deviceType)) {
    console.warn(`Invalid device type: ${deviceType}`);
    return null;
  }

  // Escape and create regex
  const escaped = escapeRegExp(deviceType);
  return new RegExp(escaped, flags);
}
```

```typescript
// Update useStatePanelConfigs.ts
import { createDeviceTypeRegex, isValidDeviceType } from '@/utils/regex';

// Replace unsafe code:
const safeRegex = createDeviceTypeRegex(deviceType, 'gi');
if (!safeRegex) {
  return baseConfig; // Return default config for invalid types
}

title: baseConfig.title.replace(safeRegex, customDeviceType),
```

**Testing:**

```typescript
// frontend/src/utils/__tests__/regex.test.ts
import { escapeRegExp, createDeviceTypeRegex } from '../regex';

describe('escapeRegExp', () => {
  it('escapes special characters', () => {
    expect(escapeRegExp('camera.')).toBe('camera\\.');
    expect(escapeRegExp('cam[era]')).toBe('cam\\[era\\]');
  });
});

describe('createDeviceTypeRegex', () => {
  it('returns null for invalid types', () => {
    expect(createDeviceTypeRegex('invalid')).toBeNull();
    expect(createDeviceTypeRegex('camera<script>')).toBeNull();
  });

  it('creates regex for valid types', () => {
    const regex = createDeviceTypeRegex('camera');
    expect(regex).toBeInstanceOf(RegExp);
    expect('camera'.match(regex)).toBeTruthy();
  });
});
```

---

## Phase 3: Logging & Debugging Cleanup (Week 2)

**Goal:** Remove unsafe format strings and clean up console logging  
**Effort:** 2-3 days  
**Risk Reduction:** ~10%

### 3.1 Replace console.log with Structured Logger

**Files:** 10 files with 17 instances **Effort:** 1-2 days

**Tasks:**

- [ ] Install structured logging library (Winston/Pino)
- [ ] Create logging utility module
- [ ] Replace all console.log statements
- [ ] Add log level controls (DEBUG only in dev)
- [ ] Implement log sanitization
- [ ] Add log rotation

**Implementation:**

```bash
# Backend
cd backend
npm install winston

# Frontend
cd frontend
npm install pino pino-pretty
```

```typescript
// frontend/src/utils/logger.ts
import pino from 'pino';

const isProduction = import.meta.env.PROD;

export const logger = pino({
  level: isProduction ? 'warn' : 'debug',
  browser: {
    asObject: true,
  },
  // Redact sensitive fields
  redact: {
    paths: ['password', 'token', 'apiKey', 'client_secret'],
    remove: true,
  },
});

// Sanitize function for log messages
export function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    // Limit string length
    return data.length > 1000 ? data.substring(0, 1000) + '...' : data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys
      if (['password', 'token', 'secret', 'apiKey'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }
  return data;
}
```

```typescript
// Usage example - Replace old console.log
// BEFORE:
console.log(`[${timestamp}] [PID:${pid}] [${env}] DEBUG: ${message}`, context);

// AFTER:
logger.debug({ timestamp, pid, env, context: sanitizeLogData(context) }, message);
```

**Migration Script:**

```bash
# Find all console.log statements
grep -r "console\." frontend/src --include="*.ts" --include="*.vue" | grep -v node_modules

# Replace in batches
# Start with backend/src/server.js
```

---

### 3.2 Remove Debug Logging from Production

**Effort:** 1 day

**Tasks:**

- [ ] Add babel/vite plugin to strip console statements in production
- [ ] Configure environment-based logging
- [ ] Audit remaining console statements
- [ ] Document logging best practices

**Implementation:**

```javascript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'remove-console',
      transform(code, id) {
        if (process.env.NODE_ENV === 'production' && (id.endsWith('.ts') || id.endsWith('.js'))) {
          return code.replace(/console\.(log|debug|info)\(.*\);?/g, '');
        }
      },
    },
  ],
});
```

---

## Phase 4: Security Hardening & Best Practices (Week 2-3)

**Goal:** Implement additional security layers and establish ongoing practices  
**Effort:** 2-3 days  
**Risk Reduction:** ~15%

### 4.1 Add Security Headers

**File:** `backend/src/server.js` **Effort:** 2-3 hours

**Tasks:**

- [ ] Install helmet.js
- [ ] Configure security headers
- [ ] Test all functionality still works
- [ ] Document header configuration

**Implementation:**

```bash
cd backend
npm install helmet
```

```javascript
// backend/src/server.js
const helmet = require('helmet');

// Add after express initialization
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust as needed
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

### 4.2 Input Validation Middleware

**Effort:** 3-4 hours

**Tasks:**

- [ ] Install express-validator (backend) / zod (frontend)
- [ ] Create validation schemas
- [ ] Add validation middleware
- [ ] Update API endpoints
- [ ] Add error handling

**Implementation:**

```bash
# Backend
cd backend
npm install express-validator

# Frontend
cd frontend
npm install zod
```

```typescript
// frontend/src/validation/schemas.ts
import { z } from 'zod';

export const DeviceTypeSchema = z.enum(['camera', 'microphone', 'speaker', 'screen']);

export const TestResultSchema = z.object({
  testType: DeviceTypeSchema,
  status: z.enum(['passed', 'failed', 'pending']),
  duration: z.number().min(0),
  deviceId: z.string().optional(),
});

export type TestResult = z.infer<typeof TestResultSchema>;
```

```javascript
// backend/src/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateTestResult = [
  body('testType').isIn(['camera', 'microphone', 'speaker', 'screen']),
  body('status').isIn(['passed', 'failed', 'pending']),
  body('duration').isInt({ min: 0 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateTestResult };
```

---

### 4.3 Rate Limiting

**Effort:** 2-3 hours

**Tasks:**

- [ ] Install express-rate-limit
- [ ] Configure rate limits
- [ ] Add bypass for health checks
- [ ] Test limits work correctly

**Implementation:**

```bash
cd backend
npm install express-rate-limit
```

```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 test submissions per minute
  message: 'Test submission rate limit exceeded',
});

module.exports = { apiLimiter, testLimiter };
```

---

## Phase 5: CI/CD Integration & Automation (Week 3)

**Goal:** Automate security checks and prevent regressions  
**Effort:** 1-2 days

### 5.1 Semgrep CI Integration

**Effort:** 2-3 hours

**Tasks:**

- [ ] Create Semgrep configuration file
- [ ] Add GitHub Actions workflow
- [ ] Configure branch protection
- [ ] Set up notifications

**Implementation:**

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  semgrep:
    name: Semgrep Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit p/owasp-top-ten p/cwe-top-25
          generateSarif: '1'

      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: semgrep.sarif
```

```yaml
# .semgrep.yml
rules:
  - id: no-console-in-production
    pattern: console.log(...)
    paths:
      include:
        - 'frontend/src/**/*.ts'
        - 'backend/src/**/*.js'
    message: 'Console logging should use structured logger instead'
    severity: WARNING

  - id: no-dynamic-regexp
    pattern: new RegExp($X, ...)
    message: 'Dynamic RegExp creation detected. Use escapeRegExp utility.'
    severity: ERROR
```

---

### 5.2 Pre-commit Hooks

**Effort:** 1-2 hours

**Tasks:**

- [ ] Install husky and lint-staged
- [ ] Configure pre-commit hooks
- [ ] Add Semgrep to pre-commit
- [ ] Test hooks work correctly

**Implementation:**

```bash
# Root of project
npm install --save-dev husky lint-staged
npx husky install
```

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,vue}": ["semgrep --config=auto --error", "eslint --fix", "git add"]
  }
}
```

---

### 5.3 Dependency Scanning

**Effort:** 1 hour

**Tasks:**

- [ ] Enable Dependabot
- [ ] Configure vulnerability alerts
- [ ] Set up Snyk or npm audit in CI
- [ ] Document update policy

**Implementation:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/frontend'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 10

  - package-ecosystem: 'npm'
    directory: '/backend'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 10
```

---

## Progress Tracking

### Week 1

| Day | Task                            | Status | Notes     |
| --- | ------------------------------- | ------ | --------- |
| 1   | Dockerfile USER fix             | ⬜     | 30 min    |
| 1   | CSRF middleware setup           | ⬜     | 2-3 hours |
| 2   | CSRF frontend integration       | ⬜     | 2-3 hours |
| 2   | SRI for external scripts        | ⬜     | 1-2 hours |
| 3   | CSRF testing & documentation    | ⬜     | 2-3 hours |
| 4   | ReDoS prevention implementation | ⬜     | 3-4 hours |
| 5   | ReDoS unit tests                | ⬜     | 2-3 hours |

### Week 2

| Day | Task                               | Status | Notes     |
| --- | ---------------------------------- | ------ | --------- |
| 6   | Install structured logger          | ⬜     | 1 hour    |
| 6-7 | Replace console.log statements     | ⬜     | 1-2 days  |
| 8   | Configure production log stripping | ⬜     | 1 day     |
| 9   | Security headers (Helmet)          | ⬜     | 2-3 hours |
| 10  | Input validation middleware        | ⬜     | 3-4 hours |

### Week 3

| Day | Task                          | Status | Notes     |
| --- | ----------------------------- | ------ | --------- |
| 11  | Rate limiting                 | ⬜     | 2-3 hours |
| 12  | Semgrep CI workflow           | ⬜     | 2-3 hours |
| 13  | Pre-commit hooks              | ⬜     | 1-2 hours |
| 14  | Dependabot configuration      | ⬜     | 1 hour    |
| 15  | Final testing & documentation | ⬜     | 1 day     |

---

## Success Criteria

### Phase 1 (Must Have)

- [ ] Dockerfile runs as non-root user
- [ ] All POST/PUT/DELETE endpoints require CSRF token
- [ ] External scripts have integrity checks or are self-hosted

### Phase 2 (Should Have)

- [ ] No dynamic RegExp creation without validation
- [ ] All device types validated against whitelist
- [ ] Unit tests for regex utilities

### Phase 3 (Should Have)

- [ ] No console.log in production builds
- [ ] Structured logging implemented
- [ ] Sensitive data redacted from logs

### Phase 4 (Nice to Have)

- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting active

### Phase 5 (Nice to Have)

- [ ] Semgrep runs on every PR
- [ ] Security scans block merges on HIGH findings
- [ ] Automated dependency updates enabled

---

## Rollback Plan

### If CSRF Breaks Functionality

```javascript
// Temporarily disable for specific routes
app.use('/api/public', (req, res, next) => {
  req.csrfToken = () => '';
  next();
});
```

### If Dockerfile User Causes Issues

```dockerfile
# Quick fix: run as root temporarily
# USER root  # Uncomment if needed
```

### If Security Headers Break App

```javascript
// Disable specific headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP if causing issues
  })
);
```

---

## Resources & References

### Documentation

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Docker Security](https://docs.docker.com/develop/security-best-practices/)
- [Semgrep Documentation](https://semgrep.dev/docs/)

### Tools

- [csurf](https://www.npmjs.com/package/csurf) - CSRF protection
- [helmet](https://helmetjs.github.io/) - Security headers
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Rate limiting
- [pino](https://getpino.io/) - Fast JSON logger
- [zod](https://zod.dev/) - TypeScript schema validation

### Testing

```bash
# Test CSRF
curl -X POST http://localhost:3000/api/test -H "Content-Type: application/json" -d '{}'
# Should return 403

# Test rate limiting
for i in {1..110}; do curl http://localhost:3000/api/test; done
# Should start returning 429

# Test security headers
curl -I http://localhost:3000
# Should see X-Frame-Options, X-XSS-Protection, etc.
```

---

## Notes

- **Priority Order:** Address HIGH findings first, then MEDIUM, then INFO
- **Testing:** Every change must be tested before deployment
- **Documentation:** Update API docs when adding CSRF
- **Communication:** Notify team about CSRF token requirements
- **Monitoring:** Watch error rates after each deployment

---

_Plan created: 2026-02-06_  
_Last updated: 2026-02-06_  
_Next review: After Phase 1 completion_
