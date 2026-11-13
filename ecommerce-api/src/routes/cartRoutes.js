import express from "express";
import { body, param } from "express-validator";
import {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
  addProductToCart,
} from "../controllers/cartController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";

const router = express.Router();

const cartIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createCartValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

const putCartValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .notEmpty()
    .withMessage("Each product item must include product ID")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

/**
 * @openapi
 * /cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Lista todos los carritos (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arreglo con todos los carritos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get("/cart", authMiddleware, isAdmin, getCarts);

/**
 * @openapi
 * /cart/{id}:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Obtiene un carrito por su ID (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle del carrito
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Carrito no encontrado
 *       422:
 *         description: ID inválido
 */
router.get(
  "/cart/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

/**
 * @openapi
 * /cart/user/{id}:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Obtiene el carrito de un usuario (propio usuario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo el propio usuario o admin)
 *       422:
 *         description: ID de usuario inválido
 */
router.get(
  "/cart/user/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getCartByUser,
);

/**
 * @openapi
 * /cart:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Crea un nuevo carrito de compras
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cart'
 *     responses:
 *       201:
 *         description: Carrito creado exitosamente
 *       401:
 *         description: No autenticado
 *       422:
 *         description: Error de validación
 */
router.post(
  "/cart",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   put:
 *     tags:
 *       - Cart
 *     summary: Reemplaza o actualiza los productos de un carrito
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cart'
 *     responses:
 *       200:
 *         description: Carrito actualizado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Carrito no encontrado
 *       422:
 *         description: Error de validación
 */
router.put(
  "/cart/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Elimina un carrito por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Carrito eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Carrito no encontrado
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/cart/:id",
  authMiddleware,
  cartIdValidation,
  validate,
  deleteCart,
);

/**
 * @openapi
 * /cart/add:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Agrega un producto al carrito del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 65f1a2b3c4d5e6f7a8b9c0d2
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Producto agregado al carrito exitosamente
 *       401:
 *         description: No autenticado
 */
router.post("/cart/add", authMiddleware, addProductToCart);

export default router;
