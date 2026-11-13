describe("Rutas Críticas Adicionales E2E - Registro, Rutas Protegidas y Admin", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirige a /login cuando un visitante sin sesión intenta entrar a /orders o /wishlist", () => {
    cy.visit("/orders");
    cy.location("pathname").should("eq", "/login");
    cy.contains("h2", "Iniciar Sesión").should("be.visible");

    cy.visit("/wishlist");
    cy.location("pathname").should("eq", "/login");
  });

  it("bloquea el acceso a /admin/products para un usuario con rol customer mostrando 'Acceso denegado'", () => {
    cy.visit("/");
    cy.loginByApi({
      userId: "cust-001",
      name: "Cliente Normal",
      email: "cliente@eshop.com",
      role: "customer",
    });

    cy.visit("/admin/products");
    cy.contains("h2", "Acceso denegado").should("be.visible");
    cy.contains("No tienes permisos para acceder a esta página.").should(
      "be.visible"
    );
  });

  it("permite el acceso a /admin/products cuando el usuario tiene rol admin", () => {
    cy.visit("/");
    cy.loginByApi({
      userId: "adm-001",
      name: "Super Admin",
      email: "admin@eshop.com",
      role: "admin",
    });

    cy.visit("/admin/products");
    cy.contains("Panel de administración").should("be.visible");
  });
});

