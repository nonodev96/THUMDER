describe('Visit pages auth', () => {

  before(() => {
    cy.visit('/');
  });

  beforeEach(() => {
    cy.setCookie('user', JSON.stringify(Cypress.env('USER_COOKIES')));
    cy.visit('/'); // Reload page
  });

  it('can visit Multiview', () => {
    cy.THUMDER_goMultiview();
  });

  it('can visit calculator', () => {
    cy.THUMDER_goCalculator();
  });

  it('can visit Code', () => {
    cy.THUMDER_goCode();
  });

  it('can visit Config', () => {
    cy.THUMDER_goConfig();
  });

  it('can visit Documentation', () => {
    cy.THUMDER_goDocumentation();
  });

  it('can visit File manager', () => {
    cy.THUMDER_goFileManager();
  });

  it('can visit IDE', () => {
    cy.THUMDER_goIDE();
  });

  it('can visit Logger', () => {
    cy.THUMDER_goLogger();
  });

  it('can visit Memory', () => {
    cy.THUMDER_goMemory();
  });

  it('can visit Cycle clock diagram', () => {
    cy.THUMDER_goCycleClockDiagram();
  });

  it('can visit Pipeline', () => {
    cy.THUMDER_goPipeline();
  });

  it('can visit Profile', () => {
    cy.THUMDER_goProfile();
  });

  it('can visit Registers', () => {
    cy.THUMDER_goRegisters();
  });

  it('can visit Statistics', () => {
    cy.THUMDER_goStatistics();
  });

});
describe('Visit pages no auth', () => {

  beforeEach(() => {
  });

  it('go to login', () => {
    cy.visit('/login');
    cy.url().should('contain', '/login');
  });

  it('go to forgot my password', () => {
    cy.visit('/forgot-password');
    cy.url().should('contain', '/forgot-password');
  });

  it('go to register a new membership', () => {
    cy.visit('/register');
    cy.url().should('contain', '/register');
    cy.contains('Register a new membership');
  });

});
