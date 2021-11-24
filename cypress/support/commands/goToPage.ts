export function THUMDER_goHome() {
  cy.get('a[title="HomePage"]').click();
  cy.location('pathname').should('eq', '/');
}

export function THUMDER_openNavigation() {
  cy.get('#dropdownSubMenuNavigation').click();
}

export function THUMDER_goFileManager() {
  THUMDER_openNavigation();
  cy.get('a[title="file-manager"]').click();
  cy.location('pathname').should('eq', '/auth/file-manager');
}

export function THUMDER_goIDE() {
  THUMDER_openNavigation();
  cy.get('a[title="ide"]').click();
  cy.location('pathname').should('eq', '/auth/ide');
}

export function THUMDER_goPipeline() {
  THUMDER_openNavigation();
  cy.get('a[title="pipeline"]').click();
  cy.location('pathname').should('eq', '/auth/pipeline');
}

export function THUMDER_goCycleClockDiagram() {
  THUMDER_openNavigation();
  cy.get('a[title="cycle-clock-diagram"]').click();
  cy.location('pathname').should('eq', '/auth/cycle-clock-diagram');
}

export function THUMDER_goMemory() {
  THUMDER_openNavigation();
  cy.get('a[title="memory"]').click();
  cy.location('pathname').should('eq', '/auth/memory');
}

export function THUMDER_goCode() {
  THUMDER_openNavigation();
  cy.get('a[title="code"]').click();
  cy.location('pathname').should('eq', '/auth/code');
}

export function THUMDER_goRegisters() {
  THUMDER_openNavigation();
  cy.get('a[title="registers"]').click();
  cy.location('pathname').should('eq', '/auth/registers');
}

export function THUMDER_goProfile() {
  THUMDER_openNavigation();
  cy.get('a[title="profile"]').click();
  cy.location('pathname').should('eq', '/auth/profile');
}

export function THUMDER_goDocumentation() {
  THUMDER_openNavigation();
  cy.get('a[title="documentation"]').click();
  cy.location('pathname').should('eq', '/auth/documentation');
}

export function THUMDER_goConfig() {
  THUMDER_openNavigation();
  cy.get('a[title="config"]').click();
  cy.location('pathname').should('eq', '/auth/config');
}
