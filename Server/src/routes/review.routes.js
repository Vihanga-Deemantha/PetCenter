import express from "express";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  adminGetReviews,
  adminHideReview,
  getReviewEligibility,
} from "../controllers/review.controller.js";

const router = express.Router();

// ── Product reviews (mounted at /api/v1/products/:id/reviews via product routes)
// These are re-exported and used in product.routes.js as nested routes

// ── Stand-alone review routes ────────────────────────────────────────────────
// User can edit/delete their own review
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Admin review moderation
router.get("/admin", protect, adminOnly, adminGetReviews);
router.patch("/:id/hide", protect, adminOnly, adminHideReview);

export default router;

// Named exports for use in product.routes.js
export { getProductReviews, createReview, getReviewEligibility };
