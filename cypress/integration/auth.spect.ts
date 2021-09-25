describe('Auth access', () => {

  beforeEach(() => {
    cy.THUMDER_login()
  })

  it('should actually be accessible', () => {
    cy.visit('/auth/pipeline')
  })

  it('should actually not be accessible', () => {
    cy.visit('/login')
    cy.location('pathname').should('not.eq', '/login')
    cy.location('pathname').should('eq', '/')
  })

})
