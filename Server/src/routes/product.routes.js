import express from "express";
import {
  getProducts,
  getProductDetail,
  getCategories,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} from "../controllers/product.controller.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { uploadProductImages } from "../utils/uploadImage.js";
import {
  getProductReviews,
  createReview,
  getReviewEligibility,
} from "../controllers/review.controller.js";

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductDetail);

// ─── Review Sub-routes ────────────────────────────────────────────────────────
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createReview);
router.get("/:id/reviews/eligibility", protect, getReviewEligibility);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────
// Create product (with image upload)
router.post("/", protect, adminOnly, uploadProductImages, createProduct);

// Update product (with optional image upload)
router.put("/:id", protect, adminOnly, uploadProductImages, updateProduct);

// Update stock only (fast route)
router.patch("/:id/stock", protect, adminOnly, updateStock);

// Soft delete product
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
