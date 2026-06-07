import express from "express";
import {
  createDonationPaymentIntent,
  getMyDonations,
  getAdminDonations,
} from "../controllers/donation.controller.js";
import { protect, optionalProtect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

router.post("/create-payment-intent", optionalProtect, createDonationPaymentIntent);
router.get("/my-donations", protect, getMyDonations);
router.get("/admin/all", protect, adminOnly, getAdminDonations);

export default router;
