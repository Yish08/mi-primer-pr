// Archivo de soporte global para pruebas E2E de Cypress.
// Protege la base de datos real interceptando por defecto cualquier petición hacia /api/**
// para que, aunque el backend (localhost:4000) esté encendido, Cypress NUNCA escriba ni modifique datos reales.
import "./commands";

beforeEach(() => {
  // 1. Bloquear/simular por defecto cualquier petición de escritura (POST, PUT, PATCH, DELETE) a la API
  cy.intercept(
    { method: /(POST|PUT|PATCH|DELETE)/, url: "**/api/**" },
    (req) => {
      req.reply({
        statusCode: 200,
        body: { mockedByGlobalGuard: true },
      });
    }
  ).as("globalApiWriteGuard");

  // 2. Respuestas seguras en memoria por defecto para lecturas comunes (GET)
  cy.intercept("GET", "**/api/categories*", {
    statusCode: 200,
    body: [],
  }).as("defaultCategories");

  cy.intercept("GET", "**/api/products*", {
    statusCode: 200,
    body: [],
  }).as("defaultProducts");

  cy.intercept("GET", "**/api/cart/**", {
    statusCode: 200,
    body: { _id: "cart-test-mock", products: [] },
  }).as("defaultCart");

  cy.intercept("GET", "**/api/wishlist*", {
    statusCode: 200,
    body: { products: [] },
  }).as("defaultWishlist");
});
