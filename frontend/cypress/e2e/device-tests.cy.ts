describe('Device Test Flow', () => {
    beforeEach(() => {
        // Mock mediaDevices to simulate camera/mic presence and permission grant
        cy.intercept('**', req => {
            if (req.url.includes('/api/telemetry')) {
                req.reply({ status: 202 });
            } else {
                req.continue();
            }
        });
    });

    it('should load the tests page and show webcam test', () => {
        cy.visit('/tests');
        cy.contains('Webcam Test').should('be.visible');
        cy.contains('Microphone Test').should('be.visible');
        cy.contains('Speaker Test').should('be.visible');
    });

    it('should navigate to webcam test page and show device selector', () => {
        cy.visit('/tests/webcam');
        cy.get('header, .app-header, nav').should('exist');
        cy.get('select, .device-selector').should('exist');
    });

    it('should display permission required state initially for camera', () => {
        cy.visit('/tests/webcam');
        // Since we don't grant real permission, it should show a permission panel
        cy.contains('Camera Permission Required').should('be.visible');
    });
});
