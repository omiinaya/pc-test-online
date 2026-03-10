import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        // Set the base URL for the dev server
        baseUrl: 'http://localhost:5173',
        specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
        supportFile: 'cypress/support/e2e.ts',
        // Ensure the dev server is running before tests
        // In CI, you would start the server with `npm run dev`
    },
});
