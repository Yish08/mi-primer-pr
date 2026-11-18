import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import receiveImage from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Sube una imagen a Cloudinary (solo administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente (devuelve URL de Cloudinary)
 *       400:
 *         description: Archivo inválido o formato/tamaño no permitido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Se requiere rol de administrador
 */
// Solo admin: cada subida ocupa espacio y creditos de la cuenta de Cloudinary.
// Orden: token -> rol admin -> multer recibe el archivo -> se sube a Cloudinary
router.post("/upload", authMiddleware, isAdmin, receiveImage, uploadImage);

export default router;
