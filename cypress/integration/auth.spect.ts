describe('Auth access', () => {

  beforeEach(() => {
    cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'))
  })

  it('should actually be accessible', () => {
    cy.visit('/auth/pipeline')
  })

  it('should actually not be accessible', () => {
    cy.visit('/login')
  })

})
