describe('Tests calculator', () => {

  before(() => {
    cy.visit('/');
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
    cy.THUMDER_goCalculator();
  });

  beforeEach(() => {
  });

  it('Check byte', () => {
    cy.get("#byte_value").clear().type('123');
    cy.get("#byte_binary").should('have.value', '01111011');
    cy.get("#byte_hex").should('have.value', '7B');

    cy.get("#byte_hex").clear().type('FF');
    cy.get("#byte_binary").should('have.value', '11111111');
    cy.get("#byte_value").should('have.value', '255');

    cy.get("#byte_binary").clear().type('00001111');
    cy.get("#byte_value").should('have.value', '15');
    cy.get("#byte_hex").should('have.value', '0F');
  });

  it('Check HalfWord', () => {
    cy.get("#halfword_value").clear().type('123');
    cy.get("#halfword_binary").should('have.value', '0000000001111011');
    cy.get("#halfword_hex").should('have.value', '007B');

    cy.get("#halfword_hex").clear().type('00FF');
    cy.get("#halfword_binary").should('have.value', '0000000011111111');
    cy.get("#halfword_value").should('have.value', '255');

    cy.get("#halfword_binary").clear().type('1111111111111111');
    cy.get("#halfword_value").should('have.value', '65535');
    cy.get("#halfword_hex").should('have.value', 'FFFF');
  });

  it('Check Word', () => {
    cy.get("#word_value").clear().type('255');
    cy.get("#word_binary").should('have.value', '00000000000000000000000011111111');
    cy.get("#word_hex").should('have.value', '000000FF');

    cy.get("#word_hex").clear().type('00001000');
    cy.get("#word_binary").should('have.value', '00000000000000000001000000000000');
    cy.get("#word_value").should('have.value', '4096');

    cy.get("#word_binary").clear().type('11111111111111111111111111111111');
    cy.get("#word_value").should('have.value', '4294967295');
    cy.get("#word_hex").should('have.value', 'FFFFFFFF');
  });

  it('Check Float SubNormal', () => {
    // 1
    cy.get("#ieee754_number").clear().type('1');
    cy.get("#ieee754_binary").should('have.value', '00111111100000000000000000000000');
    cy.get("#ieee754_hex").should('have.value', '3F800000');

    // 2
    cy.get("#ieee754_number").clear().type('{rightarrow}2');
    cy.get("#ieee754_binary").should('have.value', '01000000000000000000000000000000');
    cy.get("#ieee754_hex").should('have.value', '40000000');

    // -1
    cy.get("#ieee754_number").clear().type('{rightarrow}1{leftarrow}{backspace}-');
    cy.get("#ieee754_binary").should('have.value', '10111111100000000000000000000000');
    cy.get("#ieee754_hex").should('have.value', 'BF800000');

    // -2
    cy.get("#ieee754_number").clear().type('{rightarrow}2{leftarrow}{backspace}-');
    cy.get("#ieee754_binary").should('have.value', '11000000000000000000000000000000');
    cy.get("#ieee754_hex").should('have.value', 'C0000000');

    // PI
    cy.get("#ieee754_number").clear().type('{rightarrow}31415{movetostart}{rightarrow}{backspace}');
    cy.get("#ieee754_number").type('{movetostart}{rightarrow}.');
    cy.get("#ieee754_binary").should('have.value', '01000000010010010000111001010110');
    cy.get("#ieee754_hex").should('have.value', '40490E56');
  });

  it('Check Double SubNormal', () => {
    // 1
    cy.get("#ieee754_number_64").clear().type('1');
    cy.get("#ieee754_binary_64").should('have.value', '0011111111110000000000000000000000000000000000000000000000000000');
    cy.get("#ieee754_hex_64").should('have.value', '3FF0000000000000');

    // 2
    cy.get("#ieee754_number_64").clear().type('{rightarrow}2');
    cy.get("#ieee754_binary_64").should('have.value', '0100000000000000000000000000000000000000000000000000000000000000');
    cy.get("#ieee754_hex_64").should('have.value', '4000000000000000');

    // -1
    cy.get("#ieee754_number_64").clear().type('{rightarrow}1{leftarrow}{backspace}-');
    cy.get("#ieee754_binary_64").should('have.value', '1011111111110000000000000000000000000000000000000000000000000000');
    cy.get("#ieee754_hex_64").should('have.value', 'BFF0000000000000');

    // -2
    cy.get("#ieee754_number_64").clear().type('{rightarrow}2{leftarrow}{backspace}-');
    cy.get("#ieee754_binary_64").should('have.value', '1100000000000000000000000000000000000000000000000000000000000000');
    cy.get("#ieee754_hex_64").should('have.value', 'C000000000000000');

    // PI
    cy.get("#ieee754_number_64").clear().type('{rightarrow}31415{movetostart}{rightarrow}{backspace}');
    cy.get("#ieee754_number_64").type('{movetostart}{rightarrow}.');
    cy.get("#ieee754_binary_64").should('have.value', '0100000000001001001000011100101011000000100000110001001001101111');
    cy.get("#ieee754_hex_64").should('have.value', '400921CAC0831400');

  });

});
