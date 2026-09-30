import express from "express";
import { register, login, refresh } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
//Guardamos la ruta nueva para el refresh token
router.post("/refresh", refresh);

export default router;
