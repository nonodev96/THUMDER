// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
import * as f_goToPage from './commands/goToPage';

// this is another example.


function THUMDER_login(username: string = Cypress.env('USER_EMAIL'), password: string = Cypress.env('USER_PASSWORD')): void {
  cy.visit('/login')

  cy.get('#userEmail')
    .type(username)

  cy.get('#userPassword')
    .type(password, {log: false})

  cy.get('#buttonSignInID')
    .click()

  cy.url().should('contain', '/')
}


Cypress.Commands.add('THUMDER_login', THUMDER_login);
Cypress.Commands.add('THUMDER_goHome', f_goToPage.THUMDER_goHome);
Cypress.Commands.add('THUMDER_goFileManager', f_goToPage.THUMDER_goFileManager);
Cypress.Commands.add('THUMDER_goIDE', f_goToPage.THUMDER_goIDE);
Cypress.Commands.add('THUMDER_goPipeline', f_goToPage.THUMDER_goPipeline);
Cypress.Commands.add('THUMDER_goCycleClockDiagram', f_goToPage.THUMDER_goCycleClockDiagram);
Cypress.Commands.add('THUMDER_goMemory', f_goToPage.THUMDER_goMemory);
Cypress.Commands.add('THUMDER_goCode', f_goToPage.THUMDER_goCode);
Cypress.Commands.add('THUMDER_goRegisters', f_goToPage.THUMDER_goRegisters);
Cypress.Commands.add('THUMDER_goProfile', f_goToPage.THUMDER_goProfile);
Cypress.Commands.add('THUMDER_goDocumentation', f_goToPage.THUMDER_goDocumentation);
Cypress.Commands.add('THUMDER_goConfig', f_goToPage.THUMDER_goConfig);

/**
 * Auth
 *    THUMDER_goFileManager
 *    THUMDER_goIDE
 *    THUMDER_goPipeline
 *    THUMDER_goCycleClockDiagram
 *    THUMDER_goMemory
 *    THUMDER_goCode
 *    THUMDER_goRegisters
 *    THUMDER_goProfile
 *    THUMDER_goDocumentation
 *    THUMDER_goConfig
 */
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      THUMDER_login(email?: string, password?: string): void;

      THUMDER_goHome(): void;

      THUMDER_goFileManager(): void;

      THUMDER_goIDE(): void;

      THUMDER_goPipeline(): void;

      THUMDER_goCycleClockDiagram(): void;

      THUMDER_goMemory(): void;

      THUMDER_goCode(): void;

      THUMDER_goRegisters(): void;

      THUMDER_goProfile(): void;

      THUMDER_goDocumentation(): void;

      THUMDER_goConfig(): void;
    }
  }
}
