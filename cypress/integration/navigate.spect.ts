describe('Visit pages no auth', () => {

  beforeEach(() => {

  })

  it('go to login', () => {
    cy.visit('/login')
    cy.url().should('contain', '/login')
  })

  it('go to forgot my password', () => {
    cy.visit('/forgot-password')
    cy.url().should('contain', '/forgot-password')
  })

  it('go to register a new membership', () => {
    cy.visit('/register')
    cy.url().should('contain', '/register')
    cy.contains('Register a new membership')
  })

})


describe('Visit pages auth', () => {

  before(() => {

  })

  beforeEach(() => {
    cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'))
    cy.goHome()
  })

  it('visit file-manager', () => {
    cy.get('a[title="file-manager"]').click()
    cy.url().should('contain', '/auth/file-manager')
  })

  it('visit IDE', () => {
    cy.get('a[title="IDE"]').click()
    cy.url().should('contain', '/auth/ide')
  })

  it('visit Pipeline', () => {
    cy.get('a[title="Pipeline"]').click()
    cy.url().should('contain', '/auth/pipeline')
  })

  it('visit Cycle clock diagram', () => {
    cy.get('a[title="Cycle clock diagram"]').click()
    cy.url().should('contain', '/auth/cycle-clock-diagram')
  })


})
