import express from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";

const router = express.Router();

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos desde esta IP, intenta de nuevo más tarde",
  },
});

router.use(authLimiter);

const registerValidation = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),
  body("email")
    .isString()
    .withMessage("Email must be a string")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a string"),
];

const loginValidation = [
  body("email")
    .isString()
    .withMessage("Email must be a string")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),
];

const refreshValidation = [
  (req, res, next) => {
    if (
      req.body?.refreshToken === undefined ||
      req.body?.refreshToken === null ||
      req.body?.refreshToken === ""
    ) {
      return res.status(401).json({ message: "No se mando Refresh token" });
    }
    next();
  },
  body("refreshToken")
    .isString()
    .withMessage("Refresh token must be a string")
    .notEmpty()
    .withMessage("Refresh token is required"),
];

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
router.post("/register", registerValidation, validate, register);

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
router.post("/login", loginValidation, validate, login);

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
router.post("/refresh", refreshValidation, validate, refresh);

const logoutValidation = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("Refresh token must be a string"),
];

const changePasswordValidation = [
  body("currentPassword")
    .isString()
    .withMessage("Current password must be a string")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 8, max: 72 })
    .withMessage("New password must be between 8 and 72 characters"),
];

router.post("/logout", logoutValidation, validate, logout);

router.post(
  "/change-password",
  authMiddleware,
  changePasswordValidation,
  validate,
  changePassword,
);

export default router;
