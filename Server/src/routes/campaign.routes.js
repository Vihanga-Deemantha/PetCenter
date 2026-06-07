import express from "express";
import {
  getCampaigns,
  getCampaignDetail,
  getCampaignDonors,
  getAdminCampaigns,
  createCampaign,
  updateCampaign,
  publishCampaign,
  closeCampaign,
  deleteCampaign,
} from "../controllers/campaign.controller.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { uploadCampaignImages } from "../utils/uploadImage.js";

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", getCampaigns);
router.get("/:id", getCampaignDetail);
router.get("/:id/donors", getCampaignDonors);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────
router.get("/admin/all", protect, adminOnly, getAdminCampaigns);
router.post("/admin", protect, adminOnly, uploadCampaignImages, createCampaign);
router.put("/admin/:id", protect, adminOnly, uploadCampaignImages, updateCampaign);
router.patch("/admin/:id/publish", protect, adminOnly, publishCampaign);
router.patch("/admin/:id/close", protect, adminOnly, closeCampaign);
router.delete("/admin/:id", protect, adminOnly, deleteCampaign);

export default router;
