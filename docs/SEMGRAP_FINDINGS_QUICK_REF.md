# Semgrep Findings Quick Reference

## Summary

- **Total Findings:** 27
- **High Priority:** 1
- **Medium Priority:** 2
- **Low Priority (INFO):** 24

## Files Requiring Attention

### 🔴 HIGH PRIORITY (Fix Immediately)

1. **frontend/Dockerfile:31**
   - Issue: Running container as root
   - Fix: Add `USER non-root` before CMD
   - Rule: dockerfile.security.missing-user

### 🟡 MEDIUM PRIORITY (Fix Soon)

2. **backend/src/server.js:18**
   - Issue: Missing CSRF protection
   - Fix: Add csurf middleware
   - Rule: express-check-csurf-middleware-usage

3. **frontend/index.html:20-21**
   - Issue: External script without integrity check
   - Fix: Add integrity attribute or self-host
   - Rule: missing-integrity

### 🔵 LOW PRIORITY (INFO Level)

4. **backend/src/server.js:15**
   - Issue: Unsafe format string in console.log
   - Line: `console.log(`[${timestamp}] [PID:${pid}]...`, context);`

5. **backend/src/server.js:193-201**
   - Issue: Unsanitized logging of test results
   - Rule: console-log-express

6. **frontend/src/composables/useStatePanelConfigs.ts:158,160**
   - Issue: Dynamic RegExp creation (ReDoS risk)
   - Lines:
     - `new RegExp(deviceType, 'gi')`
     - `new RegExp(deviceType.toLowerCase(), 'gi')`

7. **frontend/src/composables/utils/useStatePanelConfigs.ts:155,157**
   - Issue: Dynamic RegExp creation (ReDoS risk)
   - Same patterns as above

8. **frontend/src/composables/base/useBaseDeviceTest.ts:403**
   - Issue: Unsafe format string in console.log

9. **frontend/src/composables/useDeviceEnumeration.ts:94**
   - Issue: Unsafe format string in console.log

10. **frontend/src/composables/useErrorHandling.ts:99**
    - Issue: Unsafe format string in console.log

11. **frontend/src/composables/useMediaPermissions.ts**
    - Issue: Multiple unsafe format strings (lines 21, 43, 50, 110, 120, 126, 131, 147)

12. **frontend/src/composables/useTestResults.ts:131**
    - Issue: Unsafe format string in console.log

13. **frontend/src/main.ts**
    - Issue: Multiple unsafe format strings (lines 40, 48, 51, 56, 62, 67)

## Quick Fix Commands

### Fix Dockerfile (HIGH)

```dockerfile
# Add before final CMD
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
```

### Fix CSRF (MEDIUM)

```bash
npm install csurf cookie-parser
```

```javascript
// In server.js
const csrf = require('csurf');
app.use(cookieParser());
app.use(csrf({ cookie: true }));
```

### Fix RegExp (INFO)

```typescript
// Validate deviceType against whitelist
const ALLOWED = ['camera', 'microphone', 'speaker'];
if (!ALLOWED.includes(deviceType)) return;
```

## Priority Order

1. Fix Dockerfile user (HIGH)
2. Add CSRF protection (MEDIUM)
3. Add integrity to external scripts (MEDIUM)
4. Sanitize RegExp inputs (INFO)
5. Clean up console.log statements (INFO)
