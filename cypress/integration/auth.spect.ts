describe('Auth access', () => {

  beforeEach(() => {
    cy.visit('/login');
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
