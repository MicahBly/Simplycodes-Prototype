/// <reference types="cypress" />

describe('SimplyCodes Extension Flow', () => {
  beforeEach(() => {
    cy.installExtension();
    cy.mockCoupons([
      {
        id: '1',
        code: 'SAVE20',
        discount_type: 'percentage',
        discount_value: 20,
        description: '20% off your order',
        success_rate: 0.92,
        score: 0.95,
        confidence: 0.9,
      },
      {
        id: '2',
        code: 'SHIP10',
        discount_type: 'fixed',
        discount_value: 10,
        description: '$10 off',
        success_rate: 0.8,
        score: 0.7,
        confidence: 0.85,
      },
    ]);
  });

  it('should show extension button on supported sites', () => {
    cy.visitMockStore();
    
    // Extension button should be visible
    cy.get('#simplycodes-toggle').should('be.visible');
    cy.get('.simplycodes-badge').should('contain', 'SC');
  });

  it('should open sidebar when clicking extension button', () => {
    cy.visitMockStore();
    
    // Click extension button
    cy.get('#simplycodes-toggle').click();
    
    // Sidebar should slide in
    cy.get('#simplycodes-sidebar-container')
      .should('be.visible')
      .should('have.css', 'right', '0px');
    
    // Sidebar content should be loaded
    cy.get('#simplycodes-sidebar').should('exist');
  });

  it('should display available coupons in sidebar', () => {
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    
    // Wait for coupons to load
    cy.wait('@getCoupons');
    
    // Check coupons are displayed
    cy.get('.coupon-card').should('have.length', 2);
    
    // Best deal should be highlighted
    cy.get('.coupon-card').first().should('have.class', 'bg-primary-50');
    cy.get('.coupon-card').first().should('contain', 'BEST DEAL');
    cy.get('.coupon-card').first().should('contain', 'SAVE20');
    cy.get('.coupon-card').first().should('contain', '92% success');
  });

  it('should apply best deal automatically', () => {
    cy.visitMockStore();
    
    // Add item to cart
    cy.contains('Add to Cart').click();
    cy.get('#cart').should('be.visible');
    
    // Open extension
    cy.openSimplyCodesPopup();
    
    // Click Apply Best Deal
    cy.contains('Apply Best Deal').click();
    
    // Check that coupon was applied
    cy.get('#promoCodeEntry').should('have.value', 'SAVE20');
    cy.get('#appliedMessage').should('be.visible');
    cy.get('#cartTotal').should('contain', '$199.99');
  });

  it('should allow manual coupon application', () => {
    cy.visitMockStore();
    cy.contains('Add to Cart').click();
    cy.openSimplyCodesPopup();
    
    // Click apply on specific coupon
    cy.get('.coupon-card').last().within(() => {
      cy.contains('Apply').click();
    });
    
    // Check that the correct coupon was applied
    cy.get('#promoCodeEntry').should('have.value', 'SHIP10');
  });

  it('should switch between coupons and chat tabs', () => {
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    
    // Default should show coupons
    cy.get('.coupon-card').should('be.visible');
    
    // Switch to chat
    cy.contains('AI Assistant').click();
    cy.get('.chat-interface').should('be.visible');
    cy.contains('AI Shopping Assistant').should('be.visible');
    
    // Switch back to coupons
    cy.contains('Coupons').click();
    cy.get('.coupon-card').should('be.visible');
  });

  it('should show model loading status', () => {
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    
    // Check model status indicator
    cy.get('.model-status').should('exist');
    
    // Should show loading initially
    cy.get('.model-status').should('contain', 'Loading AI');
    
    // Simulate model ready
    cy.window().then((win) => {
      win.postMessage({ type: 'MODEL_STATUS', payload: { status: 'ready' } }, '*');
    });
    
    cy.get('.model-status').should('contain', 'AI Ready');
  });

  it('should handle chat interactions', () => {
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    cy.contains('AI Assistant').click();
    
    // Send a message
    cy.get('textarea[placeholder*="Ask about deals"]').type('What is the best deal?');
    cy.get('button[type="submit"]').click();
    
    // Check message appears
    cy.get('.chat-bubble-user').should('contain', 'What is the best deal?');
    
    // Simulate AI response
    cy.window().then((win) => {
      win.postMessage({
        type: 'CHAT_RESPONSE',
        payload: {
          success: true,
          data: {
            response: 'The best deal is SAVE20 which gives you 20% off your order.',
          },
        },
      }, '*');
    });
    
    // Check AI response appears
    cy.get('.chat-bubble-assistant')
      .should('contain', 'The best deal is SAVE20');
  });

  it('should close sidebar', () => {
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    
    // Close button should work
    cy.get('button[aria-label="Close"]').click();
    cy.get('#simplycodes-sidebar-container')
      .should('have.css', 'right', '-400px');
  });

  it('should maintain privacy - no external requests', () => {
    let externalRequestMade = false;
    
    cy.intercept('*', (req) => {
      const url = new URL(req.url);
      if (!url.hostname.includes('localhost')) {
        externalRequestMade = true;
      }
    });
    
    cy.visitMockStore();
    cy.openSimplyCodesPopup();
    cy.contains('Apply Best Deal').click();
    
    // Wait and check no external requests were made
    cy.wait(1000).then(() => {
      expect(externalRequestMade).to.be.false;
    });
  });
});