import express from "express";
import { body, param } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createUserValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

const updateUserValidation = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^\d{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lista todos los usuarios registrados (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios (sin contraseñas)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get("/users", authMiddleware, isAdmin, getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtiene el perfil de un usuario por su ID (propio usuario o admin)
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
 *         description: Datos del usuario (sin contraseña)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo el propio usuario o admin)
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: ID inválido
 */
router.get(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getUserById,
);

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Crea un nuevo usuario manualmente (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       422:
 *         description: Error de validación
 */
router.post(
  "/users",
  authMiddleware,
  isAdmin,
  createUserValidation,
  validate,
  createUser,
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Actualiza los datos de un usuario (propio usuario o admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: El email ya está en uso
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: Error de validación
 */
router.put(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Elimina un usuario por su ID (solo administradores)
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
 *       204:
 *         description: Usuario eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: ID inválido
 */
router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  deleteUser,
);

export default router;
