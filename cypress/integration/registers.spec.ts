describe('Visit pages auth', () => {

  before(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page

    cy.wait(1000);
    cy.THUMDER_goRegisters();
    cy.get('#modal-EditRegister-Button').click();
    cy.get('#itemSelectedEditMemoryValueHexadecimalId').as('input-hexadecimal');
    cy.get('#itemSelectedEditMemoryId').as('input-address');
  });

  it('Visits the page registers', () => {

  });
});
