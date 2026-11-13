import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsDoc from "swagger-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "eShop API",
      version: "1.0.0",
      description: "Documentación completa de la API REST para eShop",
    },
    servers: [{ url: "http://localhost:4000/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Category: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string", example: "Electrónica" },
            description: {
              type: "string",
              example: "Dispositivos y accesorios electrónicos",
            },
            imageURL: {
              type: "string",
              example: "https://placehold.co/800x600.png",
            },
            parentCategory: {
              type: "string",
              nullable: true,
              example: null,
            },
          },
        },
        Product: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string", example: "Audífonos Bluetooth Pro" },
            description: {
              type: "string",
              example: "Cancelación de ruido activa",
            },
            price: { type: "number", example: 1200 },
            stock: { type: "integer", example: 15 },
            imagesUrl: {
              type: "array",
              items: { type: "string" },
              example: ["/img/products/placeholder.svg"],
            },
            category: {
              type: "string",
              example: "65f1a2b3c4d5e6f7a8b9c0d1",
            },
          },
        },
        User: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Ana López" },
            email: { type: "string", example: "ana@eshop.com" },
            password: { type: "string", example: "Password123!" },
            phone: { type: "string", example: "5512345678" },
            role: {
              type: "string",
              enum: ["customer", "admin"],
              example: "customer",
            },
          },
        },
        Address: {
          type: "object",
          required: ["name", "address", "city", "postalCode", "country"],
          properties: {
            name: { type: "string", example: "Casa Principal" },
            address: { type: "string", example: "Av. Reforma 100" },
            city: { type: "string", example: "Ciudad de México" },
            state: { type: "string", example: "CDMX" },
            postalCode: { type: "string", example: "06600" },
            country: { type: "string", example: "México" },
            phone: { type: "string", example: "5512345678" },
            isDefault: { type: "boolean", example: true },
            addressType: {
              type: "string",
              enum: ["home", "work", "other"],
              example: "home",
            },
          },
        },
        PaymentMethod: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: [
                "credit_card",
                "debit_card",
                "paypal",
                "bank_transfer",
                "cash_on_delivery",
              ],
              example: "credit_card",
            },
            cardNumber: { type: "string", example: "4111222233334444" },
            cardHolderName: { type: "string", example: "Ana López" },
            expiryDate: { type: "string", example: "12/28" },
            paypalEmail: { type: "string", example: "ana@paypal.com" },
            bankName: { type: "string", example: "BBVA" },
            accountNumber: { type: "string", example: "0123456789" },
            isDefault: { type: "boolean", example: true },
          },
        },
        Cart: {
          type: "object",
          required: ["user", "products"],
          properties: {
            user: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d2",
                  },
                  quantity: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        Order: {
          type: "object",
          required: ["products", "address", "paymentMethod", "totalPrice"],
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d2",
                  },
                  quantity: { type: "integer", example: 1 },
                  price: { type: "number", example: 1200 },
                },
              },
            },
            address: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d3" },
            paymentMethod: {
              type: "string",
              example: "65f1a2b3c4d5e6f7a8b9c0d4",
            },
            shippingCost: { type: "number", example: 0 },
            totalPrice: { type: "number", example: 1392 },
          },
        },
        WishList: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              example: "65f1a2b3c4d5e6f7a8b9c0d2",
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJsDoc(options);

export { swaggerSpec };
export default swaggerSpec;
