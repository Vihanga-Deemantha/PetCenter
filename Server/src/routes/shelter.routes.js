import express from "express";
import {
  getShelters,
  getShelterDetail,
  revealShelterContact,
  getAdminShelters,
  createShelter,
  updateShelter,
  deleteShelter,
} from "../controllers/shelter.controller.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { uploadShelterLogo } from "../utils/uploadImage.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", getShelters);
router.get("/:id", getShelterDetail);
// Requires login + rate limited — otherwise "scrape-safe" contact reveal can be
// trivially bulk-harvested by iterating shelter IDs
router.post("/:id/reveal-contact", protect, sensitiveActionLimiter, revealShelterContact);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────
router.get("/admin/all", protect, adminOnly, getAdminShelters);
router.post("/admin", protect, adminOnly, uploadShelterLogo, createShelter);
router.put("/admin/:id", protect, adminOnly, uploadShelterLogo, updateShelter);
router.delete("/admin/:id", protect, adminOnly, deleteShelter);

export default router;
