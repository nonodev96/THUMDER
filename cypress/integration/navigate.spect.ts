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

// TODO
describe('Visit pages auth', () => {

  beforeEach(() => {
    cy.THUMDER_login()
  })

  it('visit file-manager', () => {
    cy.THUMDER_goFileManager();
  })

  it('visit IDE', () => {
    cy.THUMDER_goIDE();
  })

  it('visit Pipeline', () => {
    cy.THUMDER_goPipeline();
  })

  it('visit Cycle clock diagram', () => {
    cy.THUMDER_goCycleClockDiagram();
 })

  it('visit Memory', () => {
    cy.THUMDER_goMemory();
  })

  it('visit Code', () => {
    cy.THUMDER_goCode();
  })

  it('visit Registers', () => {
    cy.THUMDER_goRegisters();
  })

  it('visit Profile', () => {
    cy.THUMDER_goProfile()
  })

  it('visit Documentation', () => {
    cy.THUMDER_goDocumentation()
  })

  it('visit Config', () => {
    cy.THUMDER_goConfig()
  })

})
