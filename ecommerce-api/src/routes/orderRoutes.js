import express from "express";
import { body, param } from "express-validator";
import {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

const createOrderValidation = [
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.productId")
    .notEmpty()
    .withMessage("Each product item must include productId")
    .isMongoId()
    .withMessage("Each productId must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
  body("products.*.price")
    .notEmpty()
    .withMessage("Each product item must include price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isMongoId()
    .withMessage("Address must be a valid MongoDB ObjectId"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isMongoId()
    .withMessage("Payment method must be a valid MongoDB ObjectId"),
  body("totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
];

const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),
];

/**
 * @openapi
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Lista todas las órdenes del sistema (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de órdenes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get("/orders", authMiddleware, isAdmin, getOrders);

/**
 * @openapi
 * /orders/my-orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Obtiene las órdenes del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/orders/my-orders", authMiddleware, getMyOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Obtiene el detalle de una orden por su ID (dueño de la orden o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle de la orden
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (no eres el propietario ni administrador)
 *       404:
 *         description: Orden no encontrada
 *       422:
 *         description: ID inválido
 */
router.get(
  "/orders/:id",
  authMiddleware,
  orderIdValidation,
  validate,
  getOrderById,
);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Crea una nueva orden y descuenta el stock de los productos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Uno de los productos ya no existe
 *       409:
 *         description: Stock insuficiente para alguno de los productos
 *       422:
 *         description: Error de validación en los datos enviados
 */
router.post(
  "/orders",
  authMiddleware,
  createOrderValidation,
  validate,
  createOrder,
);

/**
 * @openapi
 * /orders/{id}:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Actualiza el estado o pago de una orden (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Estado de la orden actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Orden no encontrada
 *       422:
 *         description: Error de validación
 */
router.put(
  "/orders/:id",
  authMiddleware,
  isAdmin,
  updateOrderStatusValidation,
  validate,
  updateOrderStatus,
);

export default router;
