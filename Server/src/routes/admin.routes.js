import express from "express";
import {
  getDashboardStats,
  getPlatformStats,
  getUsers,
  blockUser,
  unblockUser,
  getAllListings,
  approveListing,
  rejectListing,
  removeListing,
  deleteUser,
  getEcosystemBuilds,
  unpublishEcosystemBuild,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { adminGetReviews, adminHideReview } from "../controllers/review.controller.js";

const router = express.Router();

// ── Public (no auth required) ─────────────────────────────────────────────────
router.get("/stats/public", getPlatformStats);

// All other admin routes require auth + admin role
router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);

// Users
router.get("/users", getUsers);
router.put("/users/:id/block", blockUser);
router.put("/users/:id/unblock", unblockUser);
router.delete("/users/:id", deleteUser);

// Listings
router.get("/listings", getAllListings);
router.put("/listings/:id/approve", approveListing);
router.put("/listings/:id/reject", rejectListing);
router.put("/listings/:id/remove", removeListing);

// Admin ecosystem moderation
router.get("/ecosystem/builds", getEcosystemBuilds);
router.patch("/ecosystem/builds/:id/unpublish", unpublishEcosystemBuild);

// Admin review moderation
router.get("/reviews", adminGetReviews);
router.patch("/reviews/:id/hide", adminHideReview);

// Export admin router
export default router;
