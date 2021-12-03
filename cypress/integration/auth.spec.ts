describe('Auth access', () => {

  before(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(null));
    cy.visit('/'); // Reload page

    cy.THUMDER_SignOut();
    cy.THUMDER_login();
  });

  it('should actually be accessible', () => {
    cy.visit('/auth/pipeline');
  });

  it('should actually not be accessible', () => {
    cy.location('pathname').should('not.eq', '/login');
  });

});
