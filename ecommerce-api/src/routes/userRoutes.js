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

router.get("/users", authMiddleware, isAdmin, getUsers);

router.get(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getUserById,
);

router.post(
  "/users",
  authMiddleware,
  isAdmin,
  createUserValidation,
  validate,
  createUser,
);

router.put(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  deleteUser,
);

export default router;
