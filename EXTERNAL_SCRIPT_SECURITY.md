# External Script Security Documentation

## Overview

This document explains the security considerations for external third-party scripts used in the MMIT
Lab application and the decisions made regarding subresource integrity (SRI).

---

## Google AdSense Script

**URL:** `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` **Location:**
`frontend/index.html` (lines 19-26)

### Why SRI is Not Implemented

The Google AdSense script does not use subresource integrity (SRI) for the following reasons:

1. **Dynamic Nature**
   - AdSense scripts are not static; they change frequently as Google updates them
   - SRI requires a stable cryptographic hash that doesn't change
   - Adding an SRI hash would break the script within hours or days when Google updates

2. **Google AdSense Terms of Service**
   - Modifying, caching, or self-hosting AdSense scripts violates Google's TOS
   - Scripts must be loaded directly from Google's servers
   - The client ID (`ca-pub-1440039437221216`) is tied to the domain

3. **Technical Limitations**
   - Multiple versions of the script are served based on:
     - User's geographic location
     - Browser capabilities
     - A/B testing variations
   - No single hash covers all variations

### Risk Assessment

**Risk Level:** MEDIUM

**Potential Issues:**

1. CDN compromise could inject malicious code
2. Man-in-the-middle attacks (mitigated by HTTPS)
3. Outdated browser support for SRI

**Mitigations Already in Place:**

- ✅ HTTPS connection (enforced)
- ✅ `crossorigin="anonymous"` attribute
- ✅ Content Security Policy (CSP) configured in backend
- ✅ No script execution beforeDOMContentLoaded (async loading)

### Recommended Alternatives

#### Option 1: Strict Content Security Policy (RECOMMENDED)

Configure CSP in backend to allow only trusted scripts:

```javascript
// backend/src/server.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://pagead2.googlesyndication.com',
        ],
      },
    },
  })
);
```

**Pros:**

- Configured on server-side
- Can be updated without code changes
- Provides script allowlisting
- Works with all modern browsers

**Cons:**

- Doesn't prevent CDN compromise
- Relies on HTTPS and certificate validation

#### Option 2: CSP Hash (For Self-Hosted Scripts Only)

If self-hosting were allowed:

```bash
# Generate SHA-384 hash
curl -s https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

```html
<script
  async
  src="/adsbygoogle.js"
  integrity="sha384-GENERATED_HASH"
  crossorigin="anonymous"
></script>
```

**⚠️ WARNING:** Self-hosting AdSense violates Google's Terms of Service and may result in account
suspension.

#### Option 3: Script Monitoring

Implement automated monitoring of external scripts:

```bash
# Weekly script hash check
#!/bin/bash
SCRIPT_HASH=$(curl -s https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js | openssl dgst -sha256 | cut -d' ' -f2)
KNOWN_HASH="a1b2c3d4e5f6..."

if [ "$SCRIPT_HASH" != "$KNOWN_HASH" ]; then
  echo "ALERT: AdSense script hash changed!"
  # Send alert to security team
fi
```

#### Option 4: Service Worker Caching

Use a service worker to cache and verify scripts:

```javascript
// frontend/src/sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440039437221216',
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

**Pros:**

- Faster loading (served from cache)
- Can verify cached files

**Cons:**

- Doesn't verify initial download
- Requires HTTPS

### Current Implementation Status

✅ **Documented:** Security decision explained in code comments ✅ **HTTPS:** All external scripts
loaded over HTTPS ✅ **CSP:** Content Security Policy configured in backend ✅ **async loading:**
Scripts loaded asynchronously to prevent render blocking ❌ **SRI:** Not applicable due to dynamic
nature of script

### Monitoring and Alerts

To monitor changes to the AdSense script:

1. **Weekly Hash Check:** Implement automated hash verification
2. **Performance Monitoring:** Track script load times
3. **Browser Console:** Watch for CSP violations
4. **AdSense Dashboard:** Monitor for account warnings

### Semgrep Finding

**Rule:** `html.security.audit.missing-integrity.missing-integrity` **Status:** Documented and
accepted **Rationale:** Technical limitation of AdSense CDN

---

## Other External Scripts

Currently, no other external scripts are used in the application. All application scripts are:

- Built and bundled by Vite
- Served from the same origin
- Subject to normal CSP restrictions

### Future External Script Policy

If adding new external scripts, follow this checklist:

- [ ] Is SRI supported? (script has stable hash)
- [ ] Can script be self-hosted? (license allows)
- [ ] Is script loaded over HTTPS?
- [ ] Is script necessary for functionality?
- [ ] Has script been audited for security issues?
- [ ] Is CSP configured to allow script origin?
- [ ] Does script have `crossorigin` attribute?
- [ ] Is `integrity` attribute added?

If any answer is "no", reconsider using the script.

---

## Security Recommendations

###Immediate (Do Now)

1. ✅ Document SRI exception for AdSense
2. ✅ Ensure CSP is properly configured
3. ⚠️ Set up monitoring for AdSense script changes

### Short-term (Next Sprint)

1. Implement weekly automated script hash checks
2. Review CSP settings for any improvements
3. Consider implementing nonce-based CSP for added security

### Long-term (Next Quarter)

1. Explore alternative ad platforms that support SRI
2. Implement service worker for script caching
3. Add security dashboard for monitoring external dependencies

---

## References

- [OWASP Subresource Integrity](https://owasp.org/www-community/attacks/Subresource_Integrity)
- [Google AdSense Policies](https://support.google.com/adsense/answer/48182)
- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [CSP: Strict Dynamic](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#strict-dynamic)

---

**Document Version:** 1.0 **Last Updated:** 2026-02-06 **Reviewed By:** Security Team **Next
Review:** 2026-05-06
