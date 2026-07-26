// Import commands.js using ES2015 syntax:
import './commands';

beforeEach(() => {
  // Prevent infinite loops from failed error logging during tests by intercepting POST requests to /errors
  cy.intercept('POST', '**/errors', {
    statusCode: 201,
    body: { id: 'logged-error-id' },
  }).as('postErrorLogs');

  // Intercept stats requests to avoid 404s and parsing issues
  cy.intercept('GET', '**/errors/stats*', {
    statusCode: 200,
    body: {},
  }).as('getErrorsStats');
});

