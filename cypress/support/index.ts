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
import * as f_setLang from './commands/setLang';
import { THUMDER_goMultiview, THUMDER_goStatistics, THUMDER_openNavigation } from "./commands/goToPage";

function THUMDER_SignOut(): void {
  cy.wait(2000);
  cy.get("body").then($body => {
    if ($body.find("#buttonSignOutID").length > 0) {
      cy.get('#buttonSignOutID').click();
    }
  });
  cy.wait(2000);
}

function THUMDER_login(email: string = Cypress.env('USER_EMAIL'), password: string = Cypress.env('USER_PASSWORD')): void {
  cy.get('#userEmail').type(email);
  cy.get('#userPassword').type(password, {log: false});
  cy.get('#buttonSignInID').click();
  cy.wait(2000);
}


Cypress.Commands.add('THUMDER_openNavigation', THUMDER_openNavigation);
Cypress.Commands.add('THUMDER_login', THUMDER_login);
Cypress.Commands.add('THUMDER_SignOut', THUMDER_SignOut);

Cypress.Commands.add('THUMDER_goHome', f_goToPage.THUMDER_goHome);
Cypress.Commands.add('THUMDER_goMultiview', f_goToPage.THUMDER_goMultiview);
Cypress.Commands.add('THUMDER_goCalculator', f_goToPage.THUMDER_goCalculator);
Cypress.Commands.add('THUMDER_goCode', f_goToPage.THUMDER_goCode);
Cypress.Commands.add('THUMDER_goConfig', f_goToPage.THUMDER_goConfig);
Cypress.Commands.add('THUMDER_goDocumentation', f_goToPage.THUMDER_goDocumentation);
Cypress.Commands.add('THUMDER_goFileManager', f_goToPage.THUMDER_goFileManager);
Cypress.Commands.add('THUMDER_goIDE', f_goToPage.THUMDER_goEditor);
Cypress.Commands.add('THUMDER_goPipeline', f_goToPage.THUMDER_goPipeline);
Cypress.Commands.add('THUMDER_goLogger', f_goToPage.THUMDER_goLogger);
Cypress.Commands.add('THUMDER_goMemory', f_goToPage.THUMDER_goMemory);
Cypress.Commands.add('THUMDER_goCycleClockDiagram', f_goToPage.THUMDER_goCycleClockDiagram);
Cypress.Commands.add('THUMDER_goProfile', f_goToPage.THUMDER_goProfile);
Cypress.Commands.add('THUMDER_goRegisters', f_goToPage.THUMDER_goRegisters);
Cypress.Commands.add('THUMDER_goStatistics', f_goToPage.THUMDER_goStatistics);

Cypress.Commands.add('THUMDER_setLangSpanish', f_setLang.THUMDER_setLangSpanish);
Cypress.Commands.add('THUMDER_setLangEnglish', f_setLang.THUMDER_setLangEnglish);

/**
 * clicks:
 *    THUMDER_openNavigation
 * Auth:
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

      THUMDER_SignOut(): void;

      THUMDER_openNavigation(): void;

      THUMDER_setLangSpanish(): void;

      THUMDER_setLangEnglish(): void;

      THUMDER_goHome(): void;

      THUMDER_goMultiview(): void;

      THUMDER_goCalculator(): void;

      THUMDER_goCode(): void;

      THUMDER_goConfig(): void;

      THUMDER_goDocumentation(): void;

      THUMDER_goFileManager(): void;

      THUMDER_goIDE(): void;

      THUMDER_goLogger(): void;

      THUMDER_goMemory(): void;

      THUMDER_goCycleClockDiagram(): void;

      THUMDER_goPipeline(): void;

      THUMDER_goProfile(): void;

      THUMDER_goRegisters(): void;

      THUMDER_goStatistics(): void;
    }
  }
}
