import express from "express";
import { body, param } from "express-validator";
import {
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const createProductValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

const updateProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  // null permite quitarle la categoria al producto
  body("category")
    .optional({ values: "null" })
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /products/search:
 *   get:
 *     tags:
 *       - Products
 *     summary: Busca y filtra productos con paginación
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto a buscar en nombre o descripción
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad en stock
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Campo por el cual ordenar (ej. price, name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Dirección del ordenamiento
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de productos encontrados
 */
router.get("/products/search", searchProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Lista todos los productos
 *     responses:
 *       200:
 *         description: Un arreglo de productos
 */
router.get("/products", getProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Obtiene el detalle de un producto por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle del producto
 *       404:
 *         description: Producto no encontrado
 *       422:
 *         description: ID de producto inválido
 */
router.get("/products/:id", productIdValidation, validate, getProductById);

/**
 * @openapi
 * /products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Crea un nuevo producto (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       422:
 *         description: Datos del producto inválidos
 */
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Actualiza un producto existente (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Producto no encontrado
 *       422:
 *         description: Error de validación
 */
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  updateProductValidation,
  validate,
  updateProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Elimina un producto por su ID (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Producto eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Producto no encontrado
 *       422:
 *         description: ID de producto inválido
 */
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productIdValidation,
  validate,
  deleteProduct,
);

export default router;
