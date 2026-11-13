import express from "express";
import { body, param } from "express-validator";
import {
  getMyWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  getWishlists,
  getWishlistByUser,
  deleteWishlist,
} from "../controllers/wishlistController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const wishlistIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const addProductValidation = [
  body("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const removeProductValidation = [
  param("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags:
 *       - WishList
 *     summary: Obtiene la lista de deseos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de deseos del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/wishlist", authMiddleware, getMyWishlist);

/**
 * @openapi
 * /wishlist:
 *   post:
 *     tags:
 *       - WishList
 *     summary: Agrega un producto a la lista de deseos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishList'
 *     responses:
 *       200:
 *         description: Producto agregado a la lista de deseos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no encontrado
 *       422:
 *         description: ID de producto inválido
 */
router.post(
  "/wishlist",
  authMiddleware,
  addProductValidation,
  validate,
  addProductToWishlist,
);

/**
 * @openapi
 * /wishlist/products/{productId}:
 *   delete:
 *     tags:
 *       - WishList
 *     summary: Quita un producto de la lista de deseos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto a quitar (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Producto removido de la lista de deseos
 *       401:
 *         description: No autenticado
 *       422:
 *         description: ID de producto inválido
 */
router.delete(
  "/wishlist/products/:productId",
  authMiddleware,
  removeProductValidation,
  validate,
  removeProductFromWishlist,
);

/**
 * @openapi
 * /wishlist/all:
 *   get:
 *     tags:
 *       - WishList
 *     summary: Lista todas las listas de deseos (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las listas de deseos del sistema
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get("/wishlist/all", authMiddleware, isAdmin, getWishlists);

/**
 * @openapi
 * /wishlist/user/{id}:
 *   get:
 *     tags:
 *       - WishList
 *     summary: Obtiene la lista de deseos de un usuario (propio usuario o admin)
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
 *         description: Lista de deseos del usuario solicitado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       422:
 *         description: ID inválido
 */
router.get(
  "/wishlist/user/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getWishlistByUser,
);

/**
 * @openapi
 * /wishlist/{id}:
 *   delete:
 *     tags:
 *       - WishList
 *     summary: Elimina una lista de deseos completa por su ID (propietario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la lista de deseos (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Lista de deseos eliminada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Lista de deseos no encontrada
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/wishlist/:id",
  authMiddleware,
  wishlistIdValidation,
  validate,
  deleteWishlist,
);

export default router;
