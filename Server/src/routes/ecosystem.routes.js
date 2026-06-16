import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getPetList,
  getPetConfig,
  getMyBuilds,
  createBuild,
  updateBuild,
  deleteBuild,
  togglePublish,
  getGallery,
  getGalleryBuild,
  cloneGalleryBuild,
} from "../controllers/ecosystem.controller.js";

const router = express.Router();

// ── Public: Pet config ─────────────────────────────────────────────────────
router.get("/pets", getPetList);
router.get("/pets/:petType/config", getPetConfig);

// ── Public: Gallery browse ─────────────────────────────────────────────────
router.get("/gallery", getGallery);
router.get("/gallery/:id", getGalleryBuild);

// ── Protected: Gallery actions ─────────────────────────────────────────────
router.post("/gallery/:id/clone", protect, cloneGalleryBuild);

// ── Protected: User's own builds ───────────────────────────────────────────
router.get("/my-builds", protect, getMyBuilds);
router.post("/builds", protect, createBuild);
router.put("/builds/:id", protect, updateBuild);
router.delete("/builds/:id", protect, deleteBuild);
router.patch("/builds/:id/publish", protect, togglePublish);

export default router;
