# Semgrep Code Analysis Report

**Project:** mmit-testing-app  
**Scan Date:** 2026-02-06  
**Semgrep Version:** 1.151.0  
**Files Scanned:** 101  
**Rules Run:** 420  
**Total Findings:** 27

---

## Executive Summary

This report presents the results of a static code analysis performed using Semgrep on the
mmit-testing-app codebase. The scan identified **27 code findings** across the frontend and backend
components. While most findings are informational (related to logging practices), there are several
medium-priority security concerns that should be addressed.

### Risk Distribution

- **INFO:** 24 findings (89%)
- **MEDIUM:** 2 findings (7%)
- **HIGH:** 1 finding (4%)

### Findings by Category

1. **Unsafe Format Strings** - 17 findings
2. **Security Misconfiguration** - 4 findings
3. **Potential ReDoS** - 2 findings
4. **Container Security** - 1 finding
5. **Missing Security Headers** - 1 finding
6. **CSRF Protection** - 1 finding

---

## High Priority Findings

### 1. Missing Container User (HIGH)

**File:** `frontend/Dockerfile:31`  
**Severity:** HIGH  
**Rule:** `dockerfile.security.missing-user.missing-user`

**Description:**  
The Dockerfile does not specify a USER instruction, meaning the application runs as 'root' by
default. This is a significant security hazard as it violates the principle of least privilege.

**Current Code:**

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

**Recommendation:**

```dockerfile
USER non-root
CMD ["nginx", "-g", "daemon off;"]
```

**Impact:** If an attacker exploits the application, they would have root privileges within the
container, potentially compromising the host system.

---

## Medium Priority Findings

### 2. Missing CSRF Protection (MEDIUM)

**File:** `backend/src/server.js:18`  
**Severity:** MEDIUM  
**Rule:** `javascript.express.security.audit.express-check-csurf-middleware-usage`

**Description:**  
The Express application does not implement CSRF (Cross-Site Request Forgery) protection middleware.
This could allow attackers to perform unauthorized actions on behalf of authenticated users.

**Recommendation:**

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

**Impact:** Attackers could trick users into performing unintended actions, such as changing
settings or submitting data without their consent.

### 3. Missing Subresource Integrity (MEDIUM)

**File:** `frontend/index.html:20-21`  
**Severity:** MEDIUM  
**Rule:** `html.security.audit.missing-integrity.missing-integrity`

**Description:**  
External scripts loaded from Google AdSense lack the `integrity` attribute. If the CDN is
compromised, malicious code could be injected into the application.

**Current Code:**

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440039437221216"
  crossorigin="anonymous"
></script>
```

**Recommendation:** Add the integrity attribute with a SHA-384 hash:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440039437221216"
  integrity="sha384-[hash]"
  crossorigin="anonymous"
></script>
```

**Note:** Since this is a third-party script that may change, consider self-hosting critical scripts
or using a service worker for caching with integrity checks.

---

## Informational Findings

### 4. Potential Regular Expression Denial of Service (ReDoS)

**Files:**

- `frontend/src/composables/useStatePanelConfigs.ts:158,160`
- `frontend/src/composables/utils/useStatePanelConfigs.ts:155,157`

**Severity:** INFO  
**Rule:** `javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp`

**Description:**  
The code creates RegExp objects using dynamic variables (`deviceType`). If user-controlled input
reaches this code, it could lead to ReDoS attacks that block the main thread.

**Current Code:**

```typescript
title: baseConfig.title.replace(new RegExp(deviceType, 'gi'), customDeviceType),
new RegExp(deviceType.toLowerCase(), 'gi'),
```

**Recommendation:**

1. Validate `deviceType` against a whitelist of allowed values
2. Escape special regex characters before constructing the RegExp
3. Consider using hardcoded regex patterns or string methods instead

```typescript
// Option 1: Whitelist validation
const allowedDeviceTypes = ['camera', 'microphone', 'speaker'];
if (!allowedDeviceTypes.includes(deviceType)) {
  throw new Error('Invalid device type');
}

// Option 2: Escape special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const safeDeviceType = escapeRegExp(deviceType);
```

---

### 5. Unsafe Format Strings in Logging (INFO)

**Files Affected:** 10 files with 17 instances

**Severity:** INFO  
**Rule:** `javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring`

**Description:**  
Multiple locations use template literals within `console.log` statements. While these are primarily
debug logs, if an attacker can control logged data, they could inject format specifiers.

**Files and Lines:** | File | Line | Code | |------|------|------| | backend/src/server.js | 15 |
`console.log(`[${timestamp}] [PID:${pid}] [${env}] DEBUG: ${message}`, context);` | |
backend/src/server.js | 193-201 | Detailed test results logging | |
frontend/src/composables/base/useBaseDeviceTest.ts | 403 | Track settings logging | |
frontend/src/composables/useDeviceEnumeration.ts | 94 | Error enumeration logging | |
frontend/src/composables/useErrorHandling.ts | 99 | Error context logging | |
frontend/src/composables/useMediaPermissions.ts | Multiple | Permission-related logging | |
frontend/src/composables/useTestResults.ts | 131 | Test failure logging | | frontend/src/main.ts |
Multiple | App initialization logging |

**Recommendation:**

1. Remove debug logging in production builds
2. Use structured logging with sanitization
3. Avoid interpolating potentially user-controlled data directly into log messages

```typescript
// Bad
console.log(`Error in ${context}:`, err);

// Better
console.log('Error:', { context: sanitize(context), error: err.message });
```

---

### 6. Unsanitized Logging in Express (INFO)

**File:** `backend/src/server.js:193-201`  
**Severity:** INFO  
**Rule:** `javascript.express.log.console-log-express.console-log-express`

**Description:**  
Detailed test results are logged without sanitization. While this is internal data, sensitive
information could potentially leak into logs.

**Recommendation:** Implement a proper logging library like Winston or Pino with log level controls
and data sanitization.

---

## Detailed Statistics

### Findings by File Type

| Language   | Files | Findings |
| ---------- | ----- | -------- |
| TypeScript | 45    | 20       |
| JavaScript | 3     | 4        |
| Dockerfile | 1     | 1        |
| HTML       | 1     | 1        |
| JSON       | 13    | 1        |

### Findings by Rule Category

| Category              | Count | Severity    |
| --------------------- | ----- | ----------- |
| Unsafe Format String  | 17    | INFO        |
| Security Audit        | 4     | INFO/MEDIUM |
| Container Security    | 1     | HIGH        |
| CSRF Protection       | 1     | MEDIUM      |
| Subresource Integrity | 1     | MEDIUM      |

### CWE Coverage

The findings map to the following CWEs:

- **CWE-134:** Use of Externally-Controlled Format String (17 instances)
- **CWE-352:** Cross-Site Request Forgery (CSRF) (1 instance)
- **CWE-250:** Execution with Unnecessary Privileges (1 instance)
- **CWE-830:** Inclusion of Web Functionality from an Untrusted Source (1 instance)

---

## OWASP Top 10 2021 Mapping

| Finding                       | OWASP Category                                      |
| ----------------------------- | --------------------------------------------------- |
| Missing CSRF Protection       | A01:2021 – Broken Access Control                    |
| Missing Container User        | A05:2021 – Security Misconfiguration                |
| Missing Subresource Integrity | A06:2021 – Vulnerable and Outdated Components       |
| ReDoS Potential               | A03:2021 – Injection                                |
| Unsafe Format Strings         | A09:2021 – Security Logging and Monitoring Failures |

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Add USER directive to Dockerfile** - Prevents running as root
2. **Implement CSRF protection** - Add csurf middleware to Express
3. **Add integrity attributes** - For external scripts or self-host them

### Short-term Actions (Medium Priority)

4. **Sanitize regex inputs** - Validate deviceType before creating RegExp
5. **Implement structured logging** - Replace console.log with a proper logging library
6. **Add input validation** - For all user-controlled inputs

### Long-term Actions (Low Priority)

7. **Remove debug logging** - Strip console statements from production builds
8. **Add security headers** - Implement helmet.js for Express
9. **Regular security scans** - Integrate Semgrep into CI/CD pipeline

---

## Implementation Examples

### Fixing Dockerfile User Issue

```dockerfile
# Add before CMD
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs
CMD ["nginx", "-g", "daemon off;"]
```

### Implementing CSRF Protection

```javascript
const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Error handler for CSRF token validation
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ error: 'Invalid CSRF token' });
});
```

### Safe Regex Implementation

```typescript
const ALLOWED_DEVICE_TYPES = ['camera', 'microphone', 'speaker', 'screen'];

function createSafeRegex(deviceType: string): RegExp | null {
  if (!ALLOWED_DEVICE_TYPES.includes(deviceType)) {
    console.warn('Invalid device type:', deviceType);
    return null;
  }
  return new RegExp(deviceType, 'gi');
}
```

---

## Conclusion

The codebase shows good overall security practices with most issues being informational. The primary
concerns are:

1. **Container security** - Running as root is a significant risk
2. **CSRF protection** - Missing in Express application
3. **External dependencies** - Lack of integrity checks for CDN resources

Addressing the HIGH and MEDIUM priority findings should be the immediate focus. The INFO-level
findings related to logging are less critical but should be cleaned up for production deployments.

---

## Appendix

### A. Semgrep Command Used

```bash
semgrep --config=auto --json --output=semgrep-results.json frontend backend
```

### B. Files Skipped

- 1 file matching .semgrepignore patterns

### C. References

- [Semgrep Documentation](https://semgrep.dev/docs/)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

_Report generated by Semgrep v1.151.0 on 2026-02-06_
