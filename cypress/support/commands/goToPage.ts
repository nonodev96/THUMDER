export function THUMDER_goHome() {
  cy.get('a[title="HomePage"]').click()
  cy.location('pathname').should('eq', '/')
}

export function THUMDER_goFileManager() {
  THUMDER_goHome()
  cy.get('a[title="file-manager"]').click()
  cy.location('pathname').should('eq', '/auth/file-manager')
}

export function THUMDER_goIDE() {
  THUMDER_goHome()
  cy.get('a[title="IDE"]').click()
  cy.location('pathname').should('eq', '/auth/ide')
}

export function THUMDER_goPipeline() {
  THUMDER_goHome()
  cy.get('a[title="Pipeline"]').click()
  cy.location('pathname').should('eq', '/auth/pipeline')
}

export function THUMDER_goCycleClockDiagram() {
  THUMDER_goHome()
  cy.get('a[title="Cycle clock diagram"]').click()
  cy.location('pathname').should('eq', '/auth/cycle-clock-diagram')
}

export function THUMDER_goMemory() {
  THUMDER_goHome()
  cy.get('a[title="Memory"]').click()
  cy.location('pathname').should('eq', '/auth/memory')
}

export function THUMDER_goCode() {
  THUMDER_goHome()
  cy.get('a[title="Code"]').click()
  cy.location('pathname').should('eq', '/auth/code')
}

export function THUMDER_goRegisters() {
  THUMDER_goHome()
  cy.get('a[title="Registers"]').click()
  cy.location('pathname').should('eq', '/auth/registers')
}

export function THUMDER_goProfile() {
  THUMDER_goHome()
  cy.get('a[title="Profile"]').click()
  cy.location('pathname').should('eq', '/auth/profile')
}

export function THUMDER_goDocumentation() {
  THUMDER_goHome()
  cy.get('a[title="Documentation"]').click()
  cy.location('pathname').should('eq', '/auth/documentation')
}

export function THUMDER_goConfig() {
  THUMDER_goHome()
  cy.get('a[title="Config"]').click()
  cy.location('pathname').should('eq', '/auth/config')
}
