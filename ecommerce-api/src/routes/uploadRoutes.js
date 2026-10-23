import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import receiveImage from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Solo admin: cada subida ocupa espacio y creditos de la cuenta de Cloudinary.
// Orden: token -> rol admin -> multer recibe el archivo -> se sube a Cloudinary
router.post("/upload", authMiddleware, isAdmin, receiveImage, uploadImage);

export default router;
