describe('Tests lang', () => {

  beforeEach(() => {
    cy.visit('/');
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
