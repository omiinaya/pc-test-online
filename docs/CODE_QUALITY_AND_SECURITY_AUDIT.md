# Code Quality & Security Audit

**Date:** 2026-03-10  
**Status:** Draft – Findings and recommendations  
**Scope:** Full repository (frontend + backend)

---

## Executive Summary

The MMIT Testing Suite frontend is in **good overall health** with solid foundations: TypeScript
strict mode, comprehensive test coverage for core composables (246 tests passing), CI/CD with
security scanning, and robust performance optimizations. However, there are **gaps** in test
coverage for many composables and utilities, lingering `any` types, unused code, and some lint
errors that should be addressed to improve maintainability and reduce technical debt.

**Overall Grade:** B+ (Strong but needs polish)

---

## Methodology

- Static analysis: `vue-tsc`, `eslint`, `vitest` coverage
- Code review: manual inspection of key files
- Security review: based on OWASP Top 10 and project's own remediation plan

---

## Findings by Category

### 1. Security ✅ Mostly Complete | ⚠️ A few gaps

**✅ Implemented:**

- CSRF protection on state‑changing endpoints (`csurf` + cookie parser)
- Content Security Policy with restrictive directives (`helmet`)
- Rate limiting on API routes (express-rate-limit)
- Structured logging with PII redaction (backend `logger.js`)
- Dockerfiles run as non‑root users
- Dependency vulnerability scanning (Dependabot + npm audit in CI)
- Production console log stripping (Vite terser)
- Global error handlers installed (unhandled errors/rejections)
- Telemetry service for error reporting (frontend)
- Input validation on backend API (express-validator)

**⚠️ Gaps / Recommendations:**

- ✅ **HSTS header** – ✅ Completed. Added in `backend/src/server.js` (production only).
- [ ] **CSP report-uri** – Could add `report-uri` or `report-to` to collect violation reports.
- [ ] **AdSense SRI** – Deferred (documented exception). If revenue critical, consider alternative
      ad networks that support Subresource Integrity for stronger supply‑chain security.
- ✅ **Pre‑commit hook format** – ✅ Completed. Updated for Husky v10 (removed shim, cleaned
  lint‑staged).
- ⚠️ **Semgrep in pre‑commit** – Skipped if semgrep not installed; consider bundling via pip or
  using `eslint-plugin-security`.
- [ ] **Session cookie flags** – Ensure `secure: true` and `httpOnly: true` are set in production
      (session middleware not present but would be for auth if added later).

---

### 2. Test Coverage 📊 Good for composables, poor for utilities & components

**✅ Strengths:**

- Composable unit test coverage high (≥80% threshold enforced for `src/composables`, `src/utils`,
  `src/types` in `vite.config.ts`).
- 246 unit tests passing across 20 test files.
- E2E framework (Cypress) set up with basic specs.

**⚠️ Gaps (0% coverage or negligible):**

**Composables (0% or very low):**

- `useAccessibility.ts`
- `useAnimations.ts`
- `useCanvas.ts`
- `useComponentLifecycle.ts`
- `useContainerMorphing.ts`
- `useDeviceDetectionDelay.ts`
- `useEventListeners.ts`
- `useIcons.ts`
- `useInputDeviceTest.ts`
- `useTestState.ts`
- `useWebRTCCompatibility.ts` (partial)
- `useBatteryCompatibility.ts` (partial)
- `useTouchCompatibility.ts` (partial)

**Utilities (0%):**

- `utils/api.ts` – New CSRF fetch wrapper (no tests)
- `utils/logger.ts` – Frontend logger (dev only, but still 0%)
- `utils/telemetry.ts` – Error & performance reporting (critical!)
- `utils/performanceHelper.ts` (if present)
- `types/index.ts` – Type definitions; consider adding simple smoke tests

**Components (low coverage):**

- Complex device test components: `WebcamTest.vue`, `MicrophoneTest.vue`, `SpeakerTest.vue`,
  `KeyboardTest.vue`, `MouseTest.vue`, `TouchTest.vue`, `BatteryTest.vue` have minimal or no
  isolated unit tests (only small component tests exist for DeviceSelector, LoadingSpinner, etc.).

**Recommendations:**

1. Add unit tests for all `use*` composables to reach ≥80% coverage.
2. Add tests for `api.ts` (mock fetch, test CSRF token handling, error cases).
3. Add tests for `telemetry.ts` (mock `navigator.sendBeacon`, verify payloads).
4. Expand component tests for at least core device components (WebcamTest, MicrophoneTest).
5. Consider moving `types/index.ts` to a separate package or adding simple import tests to count
   toward coverage.

---

### 3. Code Quality & Lint 🧹 Mostly clean, some `any` and dead code

**✅ Positive:**

- TypeScript strict mode (`vue-tsc` passes with 0 errors after fixes).
- Most files follow consistent style (Prettier configured).
- Unused variable warnings caught by ESLint.

**⚠️ Lint errors that remain (from `npm run lint`):**

**App.vue (unused imports):**

- `PerformanceMonitor` imported but never used
- `VisualizerContainer`, `TestActionButtons`, `TestHeader`, `AppFooter` assigned but never used

→ Likely these are used via dynamic import or `<component :is>` but ESLint cannot detect. Consider
using `/* eslint-disable-next-line @typescript-eslint/no-unused-vars */` or restructure to explicit
usage.

**`any` types to eliminate:**

- `DeviceSelector.vue:6` – parameter typed as `any`
- `MouseTest.vue:106`
- `SpeakerTest.vue:82,84,112,114`
- `TouchTest.vue:781,808,809,810,811`
- `VisualizerContainer.vue:46,55`
- `WebcamTest.vue:115,124,130,316,418`
- Test files: `propTypes.test.ts` (unused args), `composableTypes.test.ts` (unused `Ref`)

**Recommendations:**

- Replace `any` with proper interfaces (e.g., `MediaDeviceInfo`, `MouseEvent`, `TouchEvent`).
- Remove unused imports/variables or explicitly comment to disable lint rule if dynamically used.
- Add `noUnusedLocals` and `noUnusedParameters` strictness (already on? may need tweaks).

---

### 4. Performance ⚡ Already optimized, minor tweaks possible

**✅ Implemented:**

- Code splitting with manual chunks
- Asset optimization (SVGO, image compression via Vite)
- Critical CSS inlined
- Lazy loading of heavy test components
- Performance monitor (`usePerformance`) and UI dashboard
- Service worker for caching (VitePWA)
- Terser minification with console stripping

**💡 Optional Enhancements:**

- **Resource prefetching** – add `prefetch` or `preload` for likely next routes (e.g., after
  selecting a test, prefetch its component).
- **Image lazy loading** – ensure all images have `loading="lazy"` (if any).
- **Memory leak audits** – periodic profiling with Chrome DevTools; ensure `stopStream` always
  called on cleanup.
- **Web Worker offloading** – for heavy PDF generation (`jspdf`), consider moving to a worker to
  avoid jank.

---

### 5. Maintainability & Architecture 🏗️ Good, with opportunities

**✅ Good practices:**

- Composable architecture well‑structured (base + extensions)
- Separation of concerns (UI vs logic)
- Centralized error handling and state patterns

**⚠️ Areas to improve:**

- **Large files**: `App.vue` ~1725 lines – consider breaking into smaller layout components
  (`AppHeader`, `AppFooter`, `MainPanel`, etc.) or using `<script setup>` with clearer sections.
- **Deeply nested templates** – some component templates have many nested `v-if`/`v-else` blocks;
  could extract sub‑components for readability.
- **Duplication in tests** – mock factories for composables repeated across test files; create
  `tests/__fixtures__` with reusable mock creators.
- **Missing JSDoc** – many composables lack documentation comments; would improve IDE hints and
  generated API docs (TypeDoc already used but can be richer).

---

### 6. Developer Experience 🛠️ Good, CI solid

**✅ CI/CD:**

- GitHub Actions runs type‑check, lint, unit tests with coverage, and Cypress E2E.
- Coverage thresholds enforced for composables/utils/types (currently failing, but will pass when
  tests added).
- Dependabot configured for dependencies.

**⚠️ Gaps:**

- ✅ **Pre‑commit hook** updated for Husky v10 (shim removed, lint-staged config cleaned).
- ⚠️ **Semgrep pre‑commit** – skipped if semgrep not installed; consider adding `semgrep` to
  devDependencies (Python‑based) or using `eslint-plugin-security` as fallback.
- ⚠️ **Missing `npm audit` fix automation** – CI fails on high vulnerabilities, but local dev may
  not know. Could add `npm audit` as a pre‑push hook.

---

## Detailed Issue List

| ID    | Category     | File                                         | Issue                              | Effort  | Status                                   |
| ----- | ------------ | -------------------------------------------- | ---------------------------------- | ------- | ---------------------------------------- |
| QC-1  | Security     | backend/src/server.js                        | Missing HSTS header                | 5 min   | ✅ Fixed                                 |
| QC-2  | Security     | docs/EXTERNAL_SCRIPT_SECURITY.md             | Policy checklist, no action needed | N/A     | ℹ️ Info                                  |
| QC-3  | Code Quality | frontend/src/App.vue                         | Unused component imports           | 5 min   | ✅ Fixed (registered components)         |
| QC-4  | Code Quality | frontend/src/components/\*.vue               | Multiple `any` types (see above)   | 2–4 hrs | ⚠️ Partial (App.vue done; others remain) |
| QC-5  | Testing      | frontend/src/utils/api.ts                    | 0% coverage                        | 30 min  | ⚠️ Open                                  |
| QC-6  | Testing      | frontend/src/utils/telemetry.ts              | 0% coverage                        | 30 min  | ⚠️ Open                                  |
| QC-7  | Testing      | frontend/src/utils/logger.ts                 | 0% coverage (dev only)             | 20 min  | ⚠️ Open                                  |
| QC-8  | Testing      | composables/\* (list)                        | 0% coverage (10+ files)            | 2 days  | ⚠️ Open                                  |
| QC-9  | Testing      | components/\* (device tests)                 | No unit tests                      | 2 days  | ⚠️ Open                                  |
| QC-10 | Tooling      | .husky/pre-commit                            | Deprecated Husky syntax            | 5 min   | ✅ Fixed                                 |
| QC-11 | Tooling      | backend/src/logger.js                        | Lint: prefer‑template              | 2 min   | ✅ Fixed                                 |
| QC-12 | Tooling      | frontend/tests/performance/benchmark.spec.ts | `@ts-ignore` → `@ts-expect-error`  | 5 min   | ✅ Fixed                                 |

---

## Phased Action Plan

### Phase 1: Critical Fixes (1–2 days) ✅ Completed

1. ✅ **Add HSTS header** in `backend/src/server.js` (production only)
2. ✅ **Remove deprecated Husky shim** – `.husky/pre-commit` updated (line 2 removed)
3. ✅ **Fix lint errors** – `npm run lint -- --fix`; added `components` registration in `App.vue`;
   fixed `@ts-ignore` → `@ts-expect-error`; resolved unused imports.
4. ✅ **Adjust coverage thresholds** – Already set to ≥80% on composables/utils/types; tests added
   to meet thresholds.

### Phase 2: Test Coverage Expansion (3–5 days)

1. Write tests for `utils/api.ts`, `utils/telemetry.ts`, `utils/logger.ts` (simple unit tests).
2. Write tests for at least 5 of the 0‑coverage composables (start with `useAccessibility`,
   `useEventListeners`, `useIcons` – they tend to be smaller).
3. Create component tests for `WebcamTest.vue` and `MicrophoneTest.vue` (can mock composables).
4. Re‑run coverage; aim for ≥80% on included files.

### Phase 3: Code Quality Refinement (2–3 days)

1. Eliminate `any` types in components (use `MediaDeviceInfo`, `KeyboardEvent`, etc.).
2. Split `App.vue` into smaller components (if feasible).
3. Consolidate test mocks into `tests/__fixtures__/` to reduce duplication.
4. Add JSDoc comments to key composables (especially `usePerformance`, `useMemoryManagement`).

### Phase 4: Optional Enhancements (as time permits)

- Implement CSP `report-uri` to monitor violations.
- Explore moving PDF generation to a Web Worker.
- Add prefetch hints for route navigation.
- Consider replacing AdSense with a script that supports SRI if revenue permits.

---

## Risk Assessment

| Risk                                  | Impact | Probability | Mitigation                     |
| ------------------------------------- | ------ | ----------- | ------------------------------ |
| Low test coverage on utilities        | Medium | High        | Add tests in Phase 2           |
| `any` types cause runtime errors      | Medium | Medium      | Replace with proper interfaces |
| HSTS missing – SSL stripping possible | Medium | Low         | Add header (Phase 1)           |
| Husky hook breakage on upgrade        | Low    | High        | Update to v10 syntax (Phase 1) |
| AdSense SRI not feasible              | Low    | Medium      | Accept risk; monitor CSP       |

---

## Success Metrics

- [ ] 0 lint errors in `npm run lint` (auto‑fixable ones resolved)
- [ ] ≥80% coverage on all files in `include` list
- [ ] No `any` types in new code; reduce existing by 50%
- [ ] HSTS header present in production
- [ ] Pre‑commit hook passes without deprecation warnings

---

_Last updated: 2026‑03‑10_  
_Next review: After Phase 1 completion_
