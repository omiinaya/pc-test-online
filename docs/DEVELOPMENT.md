# MMIT Testing Suite - Development Guide

This guide covers setting up the development environment, common workflows, and code standards for
the MMIT Testing Suite frontend.

## Prerequisites

- **Node.js**: v18+ (recommended v20)
- **npm**: v9+
- **Git**: for version control

## Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd pc-test-online

# Install dependencies
cd frontend
npm ci

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

## Available Scripts

| Script                  | Description                                   |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start Vite development server with hot reload |
| `npm run build`         | Create a production build in `dist/`          |
| `npm run preview`       | Preview production build locally              |
| `npm run type-check`    | Run `vue-tsc` for static type analysis        |
| `npm run lint`          | Lint code with ESLint (auto-fix with `--fix`) |
| `npm run format`        | Format code with Prettier                     |
| `npm test`              | Run unit tests with Vitest (watch mode)       |
| `npm test -- --run`     | Run tests once (CI mode)                      |
| `npm run test:ui`       | Open Vitest UI                                |
| `npm run coverage`      | Run tests and generate coverage report        |
| `npm run analyze`       | Open bundle analyzer for build analysis       |
| `npm run generate-docs` | Generate TypeDoc API documentation            |

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Vue components
│   ├── composables/         # Vue composition functions
│   │   ├── base/            # Base composables (useBaseDeviceTest)
│   │   ├── extensions/      # Extended composables (useMediaDeviceTest)
│   │   └── utils/           # Utility composables
│   ├── i18n/                # Internationalization
│   ├── router/              # Vue Router configuration
│   ├── styles/              # Global CSS
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions
│   └── views/               # Page components
├── cypress/                 # E2E tests
├── docs/                    # Generated API docs and planning docs
├── tests/                   # Performance benchmarks
├── vite.config.ts           # Vite configuration (includes Vitest)
└── typedoc.json             # TypeDoc configuration
```

## Coding Standards

- **Language**: TypeScript with strict mode (`vue-tsc`).
- **Components**: Prefer `<script setup>` syntax (all components migrated).
- **Composables**: Follow naming pattern `use<Feature>`; return reactive objects.
- **i18n**: All user-facing strings should use `$t('key')` and be added to locale files.
- **Linting**: Run `npm run lint` before committing; fix errors.
- **Testing**: New features should include unit tests (Vitest). Aim for ≥80% coverage on
  composables/utils.

## Testing

### Unit Tests

```bash
# Run all tests in watch mode
npm test

# Run once (CI)
npm test -- --run

# Run specific file
npm test -- path/to/file.test.ts
```

### E2E Tests

```bash
# Ensure dev server is running
npm run dev

# In another terminal, open Cypress
npx cypress open

# Or run headless
npx cypress run
```

Cypress configuration: `cypress.config.ts`. Base URL: `http://localhost:5173` for dev.

## Building for Production

```bash
npm run build
# Output in frontend/dist/
```

The build includes code splitting, minification, and service worker registration (PWA).

## TypeScript & Vue

We use `vue-tsc` for type checking. All composables and components are typed. Avoid `any`; use
proper interfaces.

To add new types, extend `src/types/index.ts`.

## Internationalization

Locale files: `src/locales/en.json`, `es.json`, etc.

Add new translation keys to all language files.

Use `$t('namespace.key')` in templates and `t('namespace.key')` in scripts (via `useI18n()`).

## Performance Monitoring

The app includes a `usePerformance` composable that tracks Core Web Vitals and browser capabilities.
The `PerformanceMonitor` component displays real-time metrics.

To enable remote telemetry, set `VITE_TELEMETRY_ENDPOINT` environment variable (e.g., `.env.local`).

## Contributing

1. Create a feature branch.
2. Make changes with clear commit messages.
3. Ensure `npm run type-check` and `npm run lint` pass.
4. Add tests for new functionality.
5. Open a Pull Request describing the change.

## Troubleshooting

- **Type errors after upgrade**: run `npm run type-check` to see details.
- **Tests failing after changes**: run `npm test -- --run` to identify regressions.
- **Build fails**: check Vite console output; may need to clear cache: `rm -rf node_modules/.vite`.

## Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Guide](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [Cypress](https://www.cypress.io/)

---

Generated for MMIT Testing Suite v2.0.0
