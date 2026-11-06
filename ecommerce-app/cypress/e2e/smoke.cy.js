describe("Smoke Test - Página de inicio", () => {
  it("visita la página de inicio y verifica que carga correctamente", () => {
    cy.visit("/");
    cy.contains("eShop").should("be.visible");
    cy.get("header.header").should("be.visible");
  });
});

