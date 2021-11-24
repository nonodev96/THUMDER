describe('Tests lang', () => {

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/');
  });

  it('check spanish', () => {
    cy.THUMDER_setLangSpanish();
  });

  it('check english', () => {
    cy.THUMDER_setLangEnglish();
  });

});
