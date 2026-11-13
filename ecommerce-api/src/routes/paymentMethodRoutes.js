import express from "express";
import { body, param } from "express-validator";
import {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethodController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const paymentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
];

const createPaymentValidation = [
  body("type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

const updatePaymentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
  body("type")
    .optional()
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
  body("cardNumber")
    .optional()
    .isLength({ max: 19 })
    .withMessage("Card number must be at most 19 characters (16 digits + dashes)"),
];

/**
 * @openapi
 * /payment-methods:
 *   get:
 *     tags:
 *       - PaymentMethods
 *     summary: Lista los métodos de pago del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/payment-methods", authMiddleware, getPaymentMethods);

/**
 * @openapi
 * /payment-methods/{id}:
 *   get:
 *     tags:
 *       - PaymentMethods
 *     summary: Obtiene un método de pago por su ID (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de pago (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle del método de pago
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Método de pago no encontrado
 *       422:
 *         description: ID inválido
 */
router.get(
  "/payment-methods/:id",
  authMiddleware,
  isAdmin,
  paymentIdValidation,
  validate,
  getPaymentMethodById,
);

/**
 * @openapi
 * /payment-methods:
 *   post:
 *     tags:
 *       - PaymentMethods
 *     summary: Crea un nuevo método de pago para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       201:
 *         description: Método de pago creado exitosamente
 *       401:
 *         description: No autenticado
 *       422:
 *         description: Error de validación
 */
router.post(
  "/payment-methods",
  authMiddleware,
  createPaymentValidation,
  validate,
  createPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   put:
 *     tags:
 *       - PaymentMethods
 *     summary: Actualiza un método de pago (propietario o administrador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de pago (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       200:
 *         description: Método de pago actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Método de pago no encontrado
 *       422:
 *         description: Error de validación
 */
router.put(
  "/payment-methods/:id",
  authMiddleware,
  updatePaymentValidation,
  validate,
  updatePaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   delete:
 *     tags:
 *       - PaymentMethods
 *     summary: Elimina un método de pago (propietario o administrador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de pago (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Método de pago eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Método de pago no encontrado
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/payment-methods/:id",
  authMiddleware,
  paymentIdValidation,
  validate,
  deletePaymentMethod,
);

export default router;
