describe('Frontend App', () => {
    it('should load the page with correct title', () => {
        cy.visit('/');
        cy.title().should('include', 'MMIT Testing Suite');
    });

    it('should display main app container', () => {
        cy.visit('/');
        cy.get('#app').should('exist');
    });

    it('should show navigation or header', () => {
        cy.visit('/');
        // Adjust selectors based on actual app structure
        cy.get('header, .app-header, nav').should('exist');
    });
});
