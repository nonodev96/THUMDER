describe('My First Test', () => {

  before(() => {
    cy.visit('/login');
    cy.THUMDER_SignOut();
    cy.THUMDER_login();
  });

  it('Visits the initial project page', () => {
    cy.contains('THUMDER');
    cy.get('#title-app').contains('THUMDER');
  });

});
