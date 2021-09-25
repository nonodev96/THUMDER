describe('Tests lang', () => {

  beforeEach(() => {
    cy.THUMDER_login()
    cy.get('#dropdownSubMenuLang').click()
  })

  it('check english', () => {
    cy.get('#changeLangToEnglish').click()
    cy.contains('App works!')
  })

  it('check spanish', () => {
    cy.get('#changeLangToSpanish').click()
    cy.contains('App funciona!')
  })

})
