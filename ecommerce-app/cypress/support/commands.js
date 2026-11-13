// Comandos personalizados de Cypress para eShop

function createFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

/**
 * cy.loginByApi(userOptions)
 * Inicia sesión directamente por API (POST /api/auth/login) sin pasar por la pantalla /login,
 * guardando authToken y refreshToken en localStorage.
 * Usa cy.intercept para no tocar jamás la base de datos real.
 */
Cypress.Commands.add("loginByApi", (userOptions = {}) => {
  const user = {
    userId: userOptions.userId || "user-test-001",
    name: userOptions.name || "Usuario Prueba",
    email: userOptions.email || "usuario.prueba@eshop.com",
    password: userOptions.password || "Password123!",
    role: userOptions.role || "customer",
  };

  const fakeToken = createFakeJwt({
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const fakeRefreshToken = "fake-refresh-token-001";

  cy.intercept("POST", "**/api/auth/login", {
    statusCode: 200,
    body: {
      token: fakeToken,
      refreshToken: fakeRefreshToken,
    },
  }).as("loginByApiRequest");

  cy.window().then((win) => {
    return win
      .fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        win.localStorage.setItem("authToken", data.token);
        win.localStorage.setItem("refreshToken", data.refreshToken);
      });
  });

  cy.wait("@loginByApiRequest");
});

/**
 * cy.addProductToCart(productName)
 * Busca la tarjeta del producto en el catálogo (por nombre o la primera disponible),
 * hace clic en "Agregar al carrito" y espera a que el producto quede agregado.
 */
Cypress.Commands.add("addProductToCart", (productName) => {
  const cardChain = productName
    ? cy.contains('[data-testid="product-card"]', productName)
    : cy.get('[data-testid="product-card"]').first();

  cardChain.within(() => {
    cy.get('[data-testid="add-to-cart-btn"]').click();
    cy.get('[data-testid="add-to-cart-btn"]').should(
      "contain.text",
      "¡Agregado!"
    );
  });
});

