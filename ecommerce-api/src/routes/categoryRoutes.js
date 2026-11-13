import express from "express";
import { body, param } from "express-validator";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const categoryIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
];

const createCategoryValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

const updateCategoryValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Lista todas las categorías
 *     responses:
 *       200:
 *         description: Un arreglo de todas las categorías
 */
router.get("/categories", getCategories);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Obtiene una categoría por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Detalle de la categoría
 *       404:
 *         description: Categoría no encontrada
 *       422:
 *         description: ID inválido
 */
router.get("/categories/:id", categoryIdValidation, validate, getCategoryById);

/**
 * @openapi
 * /categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Crea una nueva categoría (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       401:
 *         description: No autenticado (token faltante o inválido)
 *       403:
 *         description: Se requiere rol de administrador
 *       422:
 *         description: Error de validación en los datos enviados
 */
router.post(
  "/categories",
  authMiddleware,
  isAdmin,
  createCategoryValidation,
  validate,
  createCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Actualiza una categoría existente (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Categoría no encontrada
 *       422:
 *         description: Error de validación
 */
router.put(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  updateCategoryValidation,
  validate,
  updateCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Elimina una categoría por su ID (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Categoría eliminada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Categoría no encontrada
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  categoryIdValidation,
  validate,
  deleteCategory,
);

export default router;
