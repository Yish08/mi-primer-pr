import express from "express";
import { body, param } from "express-validator";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const addressIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

const createAddressValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("address").notEmpty().withMessage("Address is required"),
];

const updateAddressValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("address")
    .optional()
    .notEmpty()
    .withMessage("Address cannot be empty"),
];

router.get("/addresses", authMiddleware, getUserAddresses);

router.get("/addresses/:id", addressIdValidation, validate, authMiddleware, getAddressById);

router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);

router.put(
  "/addresses/:id",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);

router.delete(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteAddress,
);

export default router;
