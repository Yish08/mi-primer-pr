import express from "express";
import { body, param } from "express-validator";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const addressIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

const createAddressValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("address").notEmpty().withMessage("Address is required"),
];

const updateAddressValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("address")
    .optional()
    .notEmpty()
    .withMessage("Address cannot be empty"),
];

/**
 * @openapi
 * /addresses:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Lista las direcciones de envío del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/addresses", authMiddleware, getUserAddresses);

/**
 * @openapi
 * /addresses/{id}:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Obtiene el detalle de una dirección por su ID (propietario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle de la dirección
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 *       422:
 *         description: ID inválido
 */
router.get(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  getAddressById,
);

/**
 * @openapi
 * /addresses:
 *   post:
 *     tags:
 *       - Addresses
 *     summary: Crea una nueva dirección de envío para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 *       401:
 *         description: No autenticado
 *       422:
 *         description: Error de validación
 */
router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   put:
 *     tags:
 *       - Addresses
 *     summary: Actualiza una dirección de envío existente (propietario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Dirección actualizada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 *       422:
 *         description: Error de validación
 */
router.put(
  "/addresses/:id",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   delete:
 *     tags:
 *       - Addresses
 *     summary: Elimina una dirección de envío (propietario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Dirección eliminada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteAddress,
);

export default router;
