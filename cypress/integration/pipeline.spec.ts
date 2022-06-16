describe('Cycle Clock Diagram', () => {

  before(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page

    cy.THUMDER_SignOut();
    cy.THUMDER_login();
    cy.THUMDER_goPipeline();
    cy.THUMDER_setLangEnglish();

    cy.url().should('contain', '/auth/pipeline');

    // Define variables with @name
    cy.get('#pixiCardPipeline')
      .as('pixiCardPipeline');

    cy.get('#pixiCardPipeline button[data-card-widget="collapse"]')
      .as('pixiCardPipelineButtonMinimize');
  });

  it('Open and close card Pipeline', () => {
    cy.contains('Pipeline');

    // Check card
    /*
    cy.get('@pixiCardCycleClockDiagram')
      .should(($element) => {
        expect($element).to.have.class('card');
    });
    */

    // Check collapse
    cy.get('@pixiCardPipelineButtonMinimize').click();
    cy.get('@pixiCardPipeline')
      .should(($element) => {
        expect($element).to.have.class('collapsed-card');
      });

    // Check collapse
    cy.get('@pixiCardPipelineButtonMinimize').click();
    cy.get('@pixiCardPipeline')
      .should(($element) => {
        expect($element).not.to.have.class('collapsed-card');
      });

  });

});
