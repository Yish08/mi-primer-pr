import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { Duplex } from "node:stream";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import "../config/db.conf.js";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";
import userRoutes from "./userRoutes.js";
import cartRoutes from "./cartRoutes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";
import errorHandler from "../middlewares/errorHandler.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Secretos de prueba (aislados en memoria, sin conectar a MongoDB real)
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_REFRESH_TOKEN = "test-jwt-refresh-secret-key";

const ADMIN_ID = "507f1f77bcf86cd799439011";
const CUSTOMER_ID = "507f1f77bcf86cd799439012";
const OTHER_USER_ID = "507f1f77bcf86cd799439013";
const PRODUCT_ID = "507f1f77bcf86cd799439021";
const ADDRESS_ID = "507f1f77bcf86cd799439031";
const PAYMENT_ID = "507f1f77bcf86cd799439041";
const ORDER_ID = "507f1f77bcf86cd799439051";

function signToken(userId, name, role, expiresIn = "1h") {
  return jwt.sign({ userId, name, role }, process.env.JWT_SECRET, {
    expiresIn,
  });
}

// Helper que ejecuta peticiones contra la app de Express en memoria sin abrir puertos de red
function requestApp(app, path, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? Buffer.from(body) : null;
    const socket = new Duplex({
      read() {},
      write(_chunk, _enc, cb) {
        cb();
      },
    });
    socket.remoteAddress = headers["x-test-ip"] || "127.0.0.1";

    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = path;
    req.headers = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    if (payload) {
      req.headers["content-length"] = String(payload.length);
    }

    const res = new http.ServerResponse(req);
    const chunks = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      return origWrite(chunk, encoding, cb);
    };

    res.end = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      origEnd(chunk, encoding, cb);
      const rawText = Buffer.concat(chunks).toString("utf8");
      resolve({
        status: res.statusCode,
        text: async () => rawText,
        json: async () => (rawText ? JSON.parse(rawText) : null),
      });
    };

    res.on("error", reject);
    app.handle(req, res, reject);

    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

describe("Rutas Críticas del Backend (ecommerce-api)", () => {
  let app;

  const adminToken = signToken(ADMIN_ID, "Admin Test", "admin");
  const customerToken = signToken(CUSTOMER_ID, "Cliente Test", "customer");

  before(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api", productRoutes);
    app.use("/api", orderRoutes);
    app.use("/api", userRoutes);
    app.use("/api", cartRoutes);
    if (process.env.NODE_ENV !== "production") {
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }
    app.use((req, res) => {
      res.status(404).json({ error: "Route not found" });
    });
    app.use(errorHandler);
  });

  // =========================================================================
  // 1. RUTAS DE AUTENTICACIÓN (/api/auth)
  // =========================================================================
  describe("Auth Routes (/api/auth)", () => {
    it("POST /api/auth/register — crea un usuario nuevo cuando no existe (201)", async () => {
      User.findOne = async () => null;
      Cart.create = async () => ({ _id: "cart-1", products: [] });
      User.prototype.save = async function () {
        return this;
      };

      const res = await requestApp(app, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nuevo Usuario",
          email: "nuevo@eshop.com",
          password: "Password123!",
          phone: "5512345678",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 201);
      assert.equal(body.email, "nuevo@eshop.com");
      assert.equal(body.name, "Nuevo Usuario");
    });

    it("POST /api/auth/register — rechaza registro si el email ya existe (400)", async () => {
      User.findOne = async () => ({
        _id: CUSTOMER_ID,
        email: "existente@eshop.com",
      });

      const res = await requestApp(app, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Repetido",
          email: "existente@eshop.com",
          password: "Password123!",
          phone: "5512345678",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.message, "User already exist");
    });

    it("POST /api/auth/login — devuelve token y refreshToken con credenciales válidas (200)", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 4);
      User.findOne = async () => ({
        _id: CUSTOMER_ID,
        name: "Cliente Test",
        email: "cliente@eshop.com",
        password: hashedPassword,
        role: "customer",
      });

      const res = await requestApp(app, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "cliente@eshop.com",
          password: "Password123!",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.ok(body.token);
      assert.ok(body.refreshToken);
    });

    it("POST /api/auth/login — rechaza credenciales con contraseña incorrecta (400)", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 4);
      User.findOne = async () => ({
        _id: CUSTOMER_ID,
        name: "Cliente Test",
        email: "cliente@eshop.com",
        password: hashedPassword,
        role: "customer",
      });

      const res = await requestApp(app, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "cliente@eshop.com",
          password: "ClaveEquivocada",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.message, "Invalid Credentials");
    });

    it("POST /api/auth/refresh — rechaza petición sin refreshToken (401) y con token inválido (401)", async () => {
      const resNoToken = await requestApp(app, "/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(resNoToken.status, 401);

      const resBadToken = await requestApp(app, "/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "token.invalido.123" }),
      });
      assert.equal(resBadToken.status, 401);
    });

    it("POST /api/auth/* — bloquea inyección de operadores NoSQL ({ $ne: null } y { $regex: ... }) con 422 y activa sanitizeFilter", async () => {
      assert.equal(mongoose.get("sanitizeFilter"), true);

      const resLoginNe = await requestApp(app, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: { $ne: null },
          password: "Password123!",
        }),
      });
      assert.equal(resLoginNe.status, 422);

      const resLoginRegex = await requestApp(app, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: { $regex: "^admin" },
          password: "Password123!",
        }),
      });
      assert.equal(resLoginRegex.status, 422);

      const resRegisterNe = await requestApp(app, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Intruso",
          email: { $ne: null },
          password: "Password123!",
        }),
      });
      assert.equal(resRegisterNe.status, 422);

      const resRefreshNe = await requestApp(app, "/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: { $ne: null },
        }),
      });
      assert.equal(resRefreshNe.status, 422);
    });

    it("POST /api/auth/* — aplica rate limit por IP devolviendo 429 al exceder el límite", async () => {
      const testIp = "198.51.100.77";
      let lastRes;
      for (let i = 0; i < 16; i++) {
        lastRes = await requestApp(app, "/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-test-ip": testIp,
          },
          body: JSON.stringify({
            email: "cliente@eshop.com",
            password: "ClaveEquivocada",
          }),
        });
      }
      assert.equal(lastRes.status, 429);
    });
  });

  // =========================================================================
  // 2. RUTAS DE PRODUCTOS Y REGLAS ADMIN (/api/products)
  // =========================================================================
  describe("Products Routes & Admin Protection (/api/products)", () => {
    it("GET /api/products — lista productos públicamente sin requerir token (200)", async () => {
      Product.find = () => ({
        populate: async () => [
          { _id: PRODUCT_ID, name: "Teclado Mecánico", price: 1500, stock: 5 },
        ],
      });

      const res = await requestApp(app, "/api/products");
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.length, 1);
      assert.equal(body[0].name, "Teclado Mecánico");
    });

    it("GET /api/products/:id — valida ObjectId inválido (422) y producto no encontrado (404)", async () => {
      const resInvalid = await requestApp(app, "/api/products/id-invalido");
      assert.equal(resInvalid.status, 422);

      Product.findById = () => ({
        populate: async () => null,
      });
      const resNotFound = await requestApp(app, `/api/products/${PRODUCT_ID}`);
      assert.equal(resNotFound.status, 404);
    });

    it("POST /api/products — bloquea sin token (401) y bloquea a rol customer (403)", async () => {
      const resNoAuth = await requestApp(app, "/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mouse", price: 500 }),
      });
      assert.equal(resNoAuth.status, 401);

      const resCustomer = await requestApp(app, "/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: "Mouse", price: 500 }),
      });
      const bodyCustomer = await resCustomer.json();
      assert.equal(resCustomer.status, 403);
      assert.equal(bodyCustomer.message, "Admin access required");
    });

    it("POST /api/products — rechaza datos inválidos con 422 y permite crear producto a un admin (201)", async () => {
      const resInvalidPrice = await requestApp(app, "/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "Mouse", price: -50 }),
      });
      assert.equal(resInvalidPrice.status, 422);

      Product.create = async (data) => ({
        _id: PRODUCT_ID,
        ...data,
        populate: async function () {
          return this;
        },
      });

      const resCreated = await requestApp(app, "/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "Mouse Gamer", price: 799, stock: 12 }),
      });
      const bodyCreated = await resCreated.json();
      assert.equal(resCreated.status, 201);
      assert.equal(bodyCreated.name, "Mouse Gamer");
    });
  });

  // =========================================================================
  // 3. RUTAS DE ÓRDENES (/api/orders)
  // =========================================================================
  describe("Orders Routes (/api/orders)", () => {
    it("POST /api/orders — requiere autenticación (401) y valida el cuerpo de la orden (422)", async () => {
      const resNoAuth = await requestApp(app, "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(resNoAuth.status, 401);

      const resInvalid = await requestApp(app, "/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ products: [] }),
      });
      assert.equal(resInvalid.status, 422);
    });

    it("POST /api/orders — devuelve 409 cuando no hay stock suficiente", async () => {
      Product.findOneAndUpdate = async () => null;
      Product.findById = () => ({
        select: async () => ({
          _id: PRODUCT_ID,
          name: "Monitor 4K",
          stock: 0,
        }),
      });

      const res = await requestApp(app, "/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          products: [{ productId: PRODUCT_ID, quantity: 2, price: 5000 }],
          address: ADDRESS_ID,
          paymentMethod: PAYMENT_ID,
          totalPrice: 10000,
          shippingCost: 0,
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 409);
      assert.match(body.message, /Stock insuficiente/);
    });

    it("POST /api/orders — crea la orden exitosamente cuando hay stock disponible (201)", async () => {
      Product.findOneAndUpdate = async () => ({ _id: PRODUCT_ID, stock: 8 });
      Order.create = async (data) => ({
        _id: ORDER_ID,
        ...data,
        populate: async function () {
          return this;
        },
      });

      const res = await requestApp(app, "/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          products: [{ productId: PRODUCT_ID, quantity: 1, price: 1200 }],
          address: ADDRESS_ID,
          paymentMethod: PAYMENT_ID,
          totalPrice: 1392,
          shippingCost: 0,
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 201);
      assert.equal(body._id, ORDER_ID);
    });

    it("GET /api/orders/:id — impide ver la orden de otro usuario si no es admin (403) y permite al dueño (200)", async () => {
      const mockOrderDoc = {
        _id: ORDER_ID,
        user: { _id: OTHER_USER_ID, name: "Otro", email: "otro@eshop.com" },
        products: [],
      };
      Order.findById = () => ({
        populate() {
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve(mockOrderDoc).then(resolve, reject);
        },
      });

      const resForbidden = await requestApp(app, `/api/orders/${ORDER_ID}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(resForbidden.status, 403);

      mockOrderDoc.user._id = CUSTOMER_ID;
      const resOwner = await requestApp(app, `/api/orders/${ORDER_ID}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(resOwner.status, 200);
    });
  });

  // =========================================================================
  // 4. RUTAS DE USUARIOS Y MIDDLEWARE isSelfOrAdmin (/api/users/:id)
  // =========================================================================
  describe("Users Routes & isSelfOrAdmin (/api/users/:id)", () => {
    it("GET /api/users/:id — bloquea consultar el perfil de otro usuario (403) y permite el propio perfil (200)", async () => {
      const resOther = await requestApp(app, `/api/users/${OTHER_USER_ID}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const bodyOther = await resOther.json();
      assert.equal(resOther.status, 403);
      assert.equal(bodyOther.message, "Access denied");

      User.findById = () => ({
        select: async () => ({
          _id: CUSTOMER_ID,
          name: "Cliente Test",
          email: "cliente@eshop.com",
          role: "customer",
        }),
      });

      const resSelf = await requestApp(app, `/api/users/${CUSTOMER_ID}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const bodySelf = await resSelf.json();
      assert.equal(resSelf.status, 200);
      assert.equal(bodySelf.email, "cliente@eshop.com");
    });
  });

  // =========================================================================
  // 5. DOCUMENTACIÓN SWAGGER (/api-docs)
  // =========================================================================
  describe("Swagger UI Documentation (/api-docs)", () => {
    it("GET /api-docs/ — carga la interfaz de Swagger UI correctamente en desarrollo (200) y expone las rutas de la API", async () => {
      const res = await requestApp(app, "/api-docs/");
      const html = await res.text();
      assert.equal(res.status, 200);
      assert.match(html, /Swagger UI/);
      assert.equal(Object.keys(swaggerSpec.paths).length, 27);
    });

    it("GET /api-docs/ — devuelve 404 cuando NODE_ENV es 'production'", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      try {
        const prodApp = express();
        if (process.env.NODE_ENV !== "production") {
          prodApp.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        }
        prodApp.use((req, res) => res.status(404).json({ error: "Route not found" }));

        const res = await requestApp(prodApp, "/api-docs/");
        assert.equal(res.status, 404);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });
});
