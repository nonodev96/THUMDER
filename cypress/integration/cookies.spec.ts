describe('Cookies', () => {

  before(() => {
    cy.visit('/');
    // scy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
  });

  beforeEach(() => {
    cy.clearCookie('cookieconsent_status');
    cy.visit('/'); // Reload page
    cy.wait(1000);
  });

  it('Allow cookies', () => {
    cy.get('.cc-window').then($element => {
      if ($element.is(':visible')) {
        cy.get('.cc-allow').click();
      }
    });
  });

  it('Decline cookies', () => {
    cy.get('.cc-window').then($element => {
      if ($element.is(':visible')) {
        cy.get('.cc-deny').click();
      }
    });
  });

});
