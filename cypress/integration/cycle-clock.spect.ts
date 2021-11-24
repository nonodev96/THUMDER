describe('Cycle Clock Diagram', () => {

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
    cy.THUMDER_goCycleClockDiagram();
    cy.THUMDER_setLangEnglish();

    cy.url().should('contain', '/auth/cycle-clock-diagram');

    // Define variables with @name
    cy.get('#pixiCardCycleClockDiagram')
      .as('pixiCardCycleClockDiagram');
    cy.get('#pixiCardCycleClockDiagram button[data-card-widget="collapse"]')
      .as('pixiCardCycleClockDiagramButtonMinimize');
  });

  it('Open and close card', () => {
    cy.contains('Cycle clock diagram');

    // Check card
    cy.get('@pixiCardCycleClockDiagram')
      .should(($element) => {
        expect($element).to.have.class('card');
      });

    // Check collapse
    cy.get('@pixiCardCycleClockDiagramButtonMinimize').click();
    cy.get('@pixiCardCycleClockDiagram')
      .should(($element) => {
        expect($element).to.have.class('collapsed-card');
      });

    // Check collapse
    cy.get('@pixiCardCycleClockDiagramButtonMinimize').click();
    cy.get('@pixiCardCycleClockDiagram')
      .should(($element) => {
        expect($element).not.to.have.class('collapsed-card');
      });

  });

});
