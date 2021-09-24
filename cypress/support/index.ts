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
// import './commands';

Cypress.Commands.add('goHome', goHome);

function goHome(){
  cy.get('a[title="HomePage"]').click()
  cy.url().should('eq', 'http://localhost:4200/')
}

Cypress.Commands.add('generateToken', generateToken);

function generateToken({secret}): void {
  console.log('hi')
}

// this is another example.
Cypress.Commands.add('login', login);

function login(username: string, password: string): void {
  cy.visit('/login')

  cy.get('#userEmail')
    .type(username)

  cy.get('#userPassword')
    .type(password, {log: false})

  cy.get('#buttonSignInID')
    .click()

  cy.url().should('contain', '/')
}

declare namespace Cypress {
  interface Chainable<Subject> {
    generateToken({secret}): void;

    goHome(): void;

    /**
     * This will log user in
     * @param email string
     * @param password string
     */
    login(email: string, password: string): void;
  }
}
