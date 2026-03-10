// Custom Cypress commands can be defined here.
// This file will be automatically imported by `e2e.ts`.

// Example: Custom command to check element visibility
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, subject => {
    expect(subject).toBe('visible');
});
