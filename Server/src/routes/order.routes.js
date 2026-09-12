import express from "express";
import {
  createPaymentIntent,
  getUserOrders,
  getOrderDetail,
  updateOrderStatus,
  getAdminOrders,
  getBestsellers,
  cancelOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// All order routes require authentication
router.use(protect);

// User routes
router.post("/create-payment-intent", sensitiveActionLimiter, createPaymentIntent);
router.get("/", getUserOrders);

// ── Admin routes — MUST be declared BEFORE /:orderId wildcard ─────────────────
router.get("/admin/all-orders", adminOnly, getAdminOrders);
router.get("/admin/bestsellers", adminOnly, getBestsellers);

// ── Wildcard — must be LAST among GET routes ──────────────────────────────────
router.get("/:orderId", getOrderDetail);
router.put("/:orderId/status", adminOnly, updateOrderStatus);
router.put("/:orderId/cancel", cancelOrder);

export default router;
