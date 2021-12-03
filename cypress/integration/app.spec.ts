describe('My First Test', () => {

  before(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
  });

  it('Visits the initial project page', () => {
    cy.contains('THUMDER');
    cy.get('#title-app').contains('THUMDER');
  });

});
