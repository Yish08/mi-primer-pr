import express from "express";
import { body, param } from "express-validator";
import {
  getMyWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  getWishlists,
  getWishlistByUser,
  deleteWishlist,
} from "../controllers/wishlistController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const wishlistIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const addProductValidation = [
  body("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const removeProductValidation = [
  param("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

// --- Usuario logueado (el usuario sale del token) ---
router.get("/wishlist", authMiddleware, getMyWishlist);

router.post(
  "/wishlist",
  authMiddleware,
  addProductValidation,
  validate,
  addProductToWishlist,
);

router.delete(
  "/wishlist/products/:productId",
  authMiddleware,
  removeProductValidation,
  validate,
  removeProductFromWishlist,
);

// --- Admin / gestion ---
router.get("/wishlist/all", authMiddleware, isAdmin, getWishlists);

router.get(
  "/wishlist/user/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getWishlistByUser,
);

router.delete(
  "/wishlist/:id",
  authMiddleware,
  wishlistIdValidation,
  validate,
  deleteWishlist,
);

export default router;
