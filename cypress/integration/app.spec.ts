describe('My First Test', () => {
  it('Visits the initial project page', () => {
    cy.visit('/')
    cy.contains('THUMDER')
    cy.get('#title-app').contains('THUMDER')
  })
})
