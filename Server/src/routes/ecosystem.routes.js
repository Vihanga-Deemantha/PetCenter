import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getPetList,
  getPetConfig,
  suggestBuild,
  narrateBuild,
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
// Budget-aware starter-build suggestion — public (no side effects, a good
// try-before-signup hook), same as the rest of this section.
router.post("/suggest", suggestBuild);
// Optional AI narration of a selection the caller already has — gracefully
// falls back to plain text if no API key is configured. Public, no side
// effects, same reasoning as /suggest.
router.post("/narrate", narrateBuild);

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
