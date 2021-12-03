describe('Tests lang', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page

    cy.THUMDER_SignOut();
    cy.THUMDER_login();
  });

  it('check spanish', () => {
    cy.THUMDER_setLangSpanish();
  });

  it('check english', () => {
    cy.THUMDER_setLangEnglish();
  });

});
