export function THUMDER_setLangSpanish() {
  cy.get('#dropdownSubMenuLang').click();
  cy.get('#changeLangToSpanish').click();
}

export function THUMDER_setLangEnglish() {
  cy.get('#dropdownSubMenuLang').click();
  cy.get('#changeLangToEnglish').click();
}
