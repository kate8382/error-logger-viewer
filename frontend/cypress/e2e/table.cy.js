/* eslint-env cypress */

describe('Error Logger & Viewer', () => {
  it('открывает главную страницу и видит заголовок', () => {
    cy.visit('http://192.168.31.198:8080/');
    cy.contains('Error Logger & Viewer');
  });
});