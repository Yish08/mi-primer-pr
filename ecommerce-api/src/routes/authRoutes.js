import express from "express";
import { register, login, refresh } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registra un nuevo usuario cliente y crea su carrito vacío
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ana López
 *               email:
 *                 type: string
 *                 example: ana@eshop.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               phone:
 *                 type: string
 *                 example: "5512345678"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: El usuario ya existe
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Inicia sesión y devuelve token JWT junto con refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: ana@eshop.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Autenticación exitosa (devuelve token y refreshToken)
 *       400:
 *         description: Credenciales inválidas o el usuario no existe
 */
router.post("/login", login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Genera un nuevo token de acceso usando el refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Nuevo token JWT generado exitosamente
 *       401:
 *         description: Refresh token faltante, inválido o expirado
 */
router.post("/refresh", refresh);

export default router;
