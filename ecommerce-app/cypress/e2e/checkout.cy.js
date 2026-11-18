describe("Checkout Completo E2E - eShop", () => {
  const mockProduct = {
    _id: "prod-test-101",
    name: "Audífonos Bluetooth Pro",
    description: "Audífonos inalámbricos con cancelación de ruido",
    price: 1200,
    stock: 10,
    imagesUrl: ["/img/products/placeholder.svg"],
  };

  const mockAddresses = [
    {
      _id: "addr-001",
      name: "Casa Principal",
      address: "Av. Reforma 100",
      city: "Ciudad de México",
      postalCode: "06600",
      country: "México",
      isDefault: true,
    },
    {
      _id: "addr-002",
      name: "Oficina Central",
      address: "Insurgentes Sur 500",
      city: "Ciudad de México",
      postalCode: "03100",
      country: "México",
      isDefault: false,
    },
  ];

  const mockPayments = [
    {
      _id: "pay-001",
      type: "credit_card",
      cardHolderName: "Usuario Prueba",
      cardNumber: "4111222233334444",
      expiryDate: "12/28",
      isDefault: true,
    },
    {
      _id: "pay-002",
      type: "debit_card",
      cardHolderName: "Usuario Prueba",
      cardNumber: "5500111122228888",
      expiryDate: "08/29",
      isDefault: false,
    },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();

    // Interceptar catálogo y detalle del producto (usado por syncStock en carrito/checkout)
    cy.intercept("GET", "**/api/products", {
      statusCode: 200,
      body: [mockProduct],
    }).as("getProducts");

    cy.intercept("GET", `**/api/products/${mockProduct._id}`, {
      statusCode: 200,
      body: mockProduct,
    }).as("getProductById");

    // Interceptar direcciones y métodos de pago del usuario
    cy.intercept("GET", "**/api/addresses", {
      statusCode: 200,
      body: { addresses: mockAddresses },
    }).as("getAddresses");

    cy.intercept("GET", "**/api/payment-methods", {
      statusCode: 200,
      body: mockPayments,
    }).as("getPaymentMethods");
  });

  it("completa el flujo: login por API, agregar al carrito, ir a checkout, elegir dirección y pago, confirmar y verificar la orden creada", () => {
    const createdOrderId = "ORD-2026-999";

    cy.intercept("POST", "**/api/orders", (req) => {
      expect(req.body.address).to.equal("addr-002");
      expect(req.body.paymentMethod).to.equal("pay-002");
      expect(req.body.products).to.have.length(1);
      expect(req.body.products[0]).to.deep.equal({
        productId: mockProduct._id,
        quantity: 1,
        price: mockProduct.price,
      });

      req.reply({
        statusCode: 201,
        body: {
          _id: createdOrderId,
          createdAt: "2026-11-05T20:00:00.000Z",
          products: [
            {
              _id: "item-1",
              productId: mockProduct,
              quantity: 1,
              price: mockProduct.price,
            },
          ],
          address: mockAddresses[1],
          paymentMethod: mockPayments[1],
          shippingCost: req.body.shippingCost,
          totalPrice: req.body.totalPrice,
          status: "pending",
          paymentStatus: "pending",
        },
      });
    }).as("createOrder");

    // 1. Visitar inicio e iniciar sesión por API sin pasar por la pantalla /login
    cy.visit("/");
    cy.wait("@getProducts");
    cy.loginByApi({
      userId: "user-test-001",
      name: "Usuario Prueba",
      email: "usuario.prueba@eshop.com",
    });

    // 2. Agregar producto al carrito con el comando reutilizable
    cy.addProductToCart(mockProduct.name);
    cy.get('[data-testid="cart-badge"]').should("have.text", "1");

    // 3. Ir al carrito y proceder al checkout
    cy.get('[data-testid="cart-button"]').click();
    cy.location("pathname").should("eq", "/cart");
    cy.contains(mockProduct.name).should("be.visible");

    cy.get('[data-testid="proceed-to-checkout-btn"]').click();
    cy.location("pathname").should("eq", "/checkout");
    cy.wait(["@getAddresses", "@getPaymentMethods"]);

    // 4. Elegir dirección de envío ("Oficina Central")
    cy.get('[data-testid="address-section-change-btn"]').click();
    cy.get('[data-testid="select-address-addr-002"]').click();
    cy.get('[data-testid="address-section"]').should(
      "contain.text",
      "Oficina Central"
    );

    // 5. Elegir método de pago (tarjeta terminada en 8888)
    cy.get('[data-testid="payment-section-change-btn"]').click();
    cy.get('[data-testid="select-payment-pay-002"]').click();
    cy.get('[data-testid="payment-section"]').should("contain.text", "8888");

    // 6. Confirmar y pagar la orden
    cy.get('[data-testid="confirm-order-btn"]')
      .should("not.be.disabled")
      .click();

    // 7. Verificar que la orden se creó y se muestra en la pantalla de confirmación
    cy.wait("@createOrder");
    cy.location("pathname").should("eq", "/order-confirmation");
    cy.get('[data-testid="order-confirmation"]').should("be.visible");
    cy.contains("h1", "¡Gracias por tu compra!").should("be.visible");
    cy.get('[data-testid="order-id"]').should(
      "have.text",
      `#${createdOrderId}`
    );
    cy.contains(`${mockProduct.name} x 1`).should("be.visible");
    cy.contains("Oficina Central").should("be.visible");
    cy.get('[data-testid="cart-badge"]').should("have.text", "0");
  });
});

