describe('Memory page', () => {

  before(() => {
    cy.THUMDER_login();
    cy.THUMDER_goMemory();
  })

  it('check row 10 no changes', () => {
    cy.get(':nth-child(11) > .cdk-column-Register')
      .contains('00010');
    cy.get(':nth-child(11) > .cdk-column-Decimal')
      .contains('0');
    cy.get(':nth-child(11) > .cdk-column-Hexadecimal')
      .contains('0');
    cy.get(':nth-child(11) > .cdk-column-Binary')
      .contains('0x0000000000000000000000000000000');
  })

  it('change row 10', () => {
    cy.get('#editMemoryModalButton').click()
    cy.get('#itemSelectedEditMemoryId').clear().type('10', {force: true})
    cy.get('#itemSelectedEditControlId').clear().type('12345 {enter}', {force: true})
    cy.get('#hexValue').clock()
    cy.get('button[aria-label="Close"]').click()
  })

  it('check row 10 changes', () => {
    cy.get(':nth-child(11) > .cdk-column-Register')
      .contains('00010');
    cy.get(':nth-child(11) > .cdk-column-Decimal')
      .contains('12345');
    cy.get(':nth-child(11) > .cdk-column-Hexadecimal')
      .contains('3039');
    cy.get(':nth-child(11) > .cdk-column-Binary')
      .contains('0x0000000000000000011000000111001');
  })

})
