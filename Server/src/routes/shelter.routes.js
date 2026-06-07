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

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", getShelters);
router.get("/:id", getShelterDetail);
router.post("/:id/reveal-contact", revealShelterContact);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────
router.get("/admin/all", protect, adminOnly, getAdminShelters);
router.post("/admin", protect, adminOnly, uploadShelterLogo, createShelter);
router.put("/admin/:id", protect, adminOnly, uploadShelterLogo, updateShelter);
router.delete("/admin/:id", protect, adminOnly, deleteShelter);

export default router;
