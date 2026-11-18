// Helper para construir un JWT de prueba válido que decodeToken() en src/utils/auth.js pueda decodificar
function createFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe("Login E2E - eShop", () => {
  const testUser = {
    userId: "user-test-001",
    name: "Usuario Prueba",
    email: "usuario.prueba@eshop.com",
    password: "Password123!",
    role: "customer",
  };

  beforeEach(() => {
    cy.clearLocalStorage();

    // Interceptar lecturas y escrituras de carrito/wishlist/catálogo para jamás tocar la base de datos real
    cy.intercept("GET", "**/api/categories*", {
      statusCode: 200,
      body: [],
    }).as("getCategories");

    cy.intercept("GET", "**/api/products*", {
      statusCode: 200,
      body: [],
    }).as("getProducts");

    cy.intercept("GET", "**/api/cart/user/*", {
      statusCode: 200,
      body: { _id: "cart-test-001", products: [] },
    }).as("getCart");

    cy.intercept("PUT", "**/api/cart/*", {
      statusCode: 200,
      body: { _id: "cart-test-001", products: [] },
    }).as("replaceCart");

    cy.intercept("GET", "**/api/wishlist*", {
      statusCode: 200,
      body: { products: [] },
    }).as("getWishlist");
  });

  it("permite iniciar sesión con credenciales correctas y redirige al inicio mostrando al usuario", () => {
    const fakeToken = createFakeJwt({
      userId: testUser.userId,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
    });

    cy.intercept("POST", "**/api/auth/login", (req) => {
      expect(req.body).to.deep.equal({
        email: testUser.email,
        password: testUser.password,
      });
      req.reply({
        statusCode: 200,
        body: {
          token: fakeToken,
          refreshToken: "fake-refresh-token-001",
        },
      });
    }).as("loginSuccess");

    cy.visit("/login");

    cy.contains("h2", "Iniciar Sesión").should("be.visible");
    cy.get("#email").type(testUser.email);
    cy.get("#password").type(testUser.password);
    cy.contains("button[type='submit']", "Iniciar Sesión").click();

    // Verifica estado de carga mientras procesa el login
    cy.contains("button[type='submit']", "Iniciando sesión...").should(
      "be.disabled"
    );

    cy.wait("@loginSuccess");

    // Verifica que redirige al inicio, guarda el token y muestra el saludo del usuario autenticado
    cy.location("pathname").should("eq", "/");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.equal(fakeToken);
      expect(win.localStorage.getItem("refreshToken")).to.equal(
        "fake-refresh-token-001"
      );
    });
    cy.contains(`Hola, ${testUser.name}`).should("be.visible");
    cy.contains("Mi Cuenta").should("be.visible");
  });

  it("muestra un mensaje de error cuando las credenciales son incorrectas y no inicia sesión", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 400,
      body: {
        message: "Invalid Credentials",
      },
    }).as("loginError");

    cy.visit("/login");

    cy.get("#email").type(testUser.email);
    cy.get("#password").type("ClaveIncorrecta999");
    cy.contains("button[type='submit']", "Iniciar Sesión").click();

    cy.wait("@loginError");

    // Verifica que se muestra el mensaje de error en pantalla, permanece en /login y no guarda token
    cy.get(".error-message")
      .should("be.visible")
      .and("contain.text", "Invalid Credentials");
    cy.location("pathname").should("eq", "/login");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.null;
    });
  });
});
