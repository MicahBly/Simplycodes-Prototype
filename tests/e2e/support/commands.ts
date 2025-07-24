/// <reference types="cypress" />

// Custom commands for SimplyCodes extension testing

Cypress.Commands.add('installExtension', () => {
  // In a real test, this would load the extension
  // For now, we'll simulate the extension being installed
  cy.window().then((win) => {
    // Mock chrome API
    (win as any).chrome = {
      runtime: {
        sendMessage: cy.stub().resolves({ success: true, data: {} }),
        onMessage: {
          addListener: cy.stub(),
        },
      },
      storage: {
        local: {
          get: cy.stub().resolves({}),
          set: cy.stub().resolves(),
        },
      },
    };
  });
});

Cypress.Commands.add('mockCoupons', (coupons) => {
  cy.intercept('GET', '**/api/coupons**', {
    statusCode: 200,
    body: { coupons },
  }).as('getCoupons');
});

Cypress.Commands.add('visitMockStore', () => {
  cy.visit('/tests/e2e/fixtures/mock-store.html');
});

Cypress.Commands.add('openSimplyCodesPopup', () => {
  cy.get('#simplycodes-toggle').click();
  cy.get('#simplycodes-sidebar-container').should('be.visible');
});

// Type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      installExtension(): Chainable<void>;
      mockCoupons(coupons: any[]): Chainable<void>;
      visitMockStore(): Chainable<void>;
      openSimplyCodesPopup(): Chainable<void>;
    }
  }
}