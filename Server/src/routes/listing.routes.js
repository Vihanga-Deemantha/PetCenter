import express from "express";
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  updateListingStatus,
  revealListingContact,
} from "../controllers/listing.controller.js";
import { protect } from "../middleware/auth.js";
import { uploadPetImages } from "../utils/uploadImage.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ── Private routes (must be before /:id to avoid route conflict) ───────────
router.get("/my/listings", protect, getMyListings);

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", getListings);
router.get("/:id", getListing);

// ── Private ───────────────────────────────────────────────────────────────────
router.post("/:id/reveal-contact", protect, sensitiveActionLimiter, revealListingContact);
router.post("/", protect, uploadPetImages, createListing);
router.put("/:id/status", protect, updateListingStatus);
router.put("/:id", protect, uploadPetImages, updateListing);
router.delete("/:id", protect, deleteListing);

export default router;
