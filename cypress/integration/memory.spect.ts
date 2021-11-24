describe('Memory page', () => {

  before(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
    cy.THUMDER_goMemory();
    cy.get('#editMemoryModalButton').click();
  });

  beforeEach(() => {
    cy.get('#itemSelectedEditMemoryValueHexadecimalId').as('input-hexadecimal');
    cy.get('#itemSelectedEditMemoryId').as('input-address');
    // cy.get('#itemSelectedEditMemoryValueDecimalId').as('input-memory-decimal');
    // cy.get('#itemSelectedEditMemoryValueFloatId').as('input-memory-float');
    // cy.get('#itemSelectedEditMemoryValueDoubleId').as('input-memory-double');
  });

  it('write number in byte', () => {
    cy.get('#typeDataByte').click();
    cy.get('#itemSelectedEditMemoryValueByteId').as('input-memory-byte');
    cy.get('@input-address').type('{backspace}0');
    cy.get('@input-memory-byte')
      .type('5')
      .type('{movetostart}')
      .type('{del}');

    cy.get('@input-address').type('{backspace}1');
    cy.get('@input-memory-byte')
      .type('10')
      .type('{movetostart}')
      .type('{del}');

    cy.get('@input-address').type('{backspace}2');
    cy.get('@input-memory-byte')
      .type('15')
      .type('{movetostart}')
      .type('{del}');

    cy.get('@input-address').type('{backspace}3');
    cy.get('@input-memory-byte')
      .type('20')
      .type('{movetostart}')
      .type('{del}');

    cy.get('[data-id="binary-address+0"]').should('contain.text', '00000101000010100000111100010100');
  });

  it('write number in half-word', () => {
    cy.get('#typeDataHalfWord').click();
    cy.get('#itemSelectedEditMemoryValueHalfWordId').as('input-memory-half-word');

    cy.get('@input-memory-half-word').click();
    cy.get('@input-address').type('{backspace}4');
    cy.get('@input-memory-half-word')
      .type('65535')
      .type('{movetostart}')
      .type('{del}');

    cy.get('@input-memory-half-word').click();
    cy.get('@input-address').type('{backspace}6');
    cy.get('@input-memory-half-word')
      .type('65535')
      .type('{movetostart}')
      .type('{del}');

    cy.get('[data-id="binary-address+0"]').should('contain.text', '11111111111111111111111111111111');
  });

  it('write number in word', () => {
    cy.get('#typeDataWord').click();
    cy.get('#itemSelectedEditMemoryValueDecimalId').as('input-memory-word');

    cy.get('@input-memory-word').click();
    cy.get('@input-address').type('{backspace}8');
    cy.get('@input-memory-word')
      .type('123456789')
      .type('{movetostart}')
      .type('{del}');

    cy.get('[data-id="binary-address+0"]').should('contain.text', '00000111010110111100110100010101');
  });

  it('write decimal in float', () => {
    // select floating type data
    cy.get('#typeDataSimpleFloatingPoint').click();
    // set address
    cy.get('@input-address').type('{backspace}C');
    // get input floating point
    cy.get('#itemSelectedEditMemoryValueFloatId').as('input-memory-float');
    // write value in floating point input
    cy.get('@input-memory-float')
      .type('31415')          // 031415|
      .type('{movetostart}')  // |031415
      .type('{del}')          // |31415
      .type('{rightarrow}')   // 3|1415
      .type('.');             // 3,|1415

    // IEEE 754 --> 3,1415 ----->  3,1414999961853027
    cy.get('@input-hexadecimal').should('have.value', '40490E56');
  });

  it('write decimal in double', () => {
    // select floating type data
    cy.get('#typeDataDoubleFloatingPoint').click();
    // set address
    cy.get('@input-address').type('{backspace}{backspace}10'); // 0x10 --> 16
    // get input floating point
    cy.get('#itemSelectedEditMemoryValueDoubleId').as('input-memory-double');
    // write value in floating point input
    cy.get('@input-memory-double')
      .type('31415')          // 031415|
      .type('{movetostart}')  // |031415
      .type('{del}')          // |31415
      .type('{rightarrow}')   // 3|1415
      .type('.');             // 3,|1415

    // IEEE 754 --> 3,1415 ----->  3,1414999961853027
    cy.get('@input-hexadecimal').should('have.value', '400921CAC0831400');
  });
});
