import express from "express";
import { handleWebhookEvent } from "../controllers/webhook.controller.js";

const router = express.Router();

/**
 * Stripe webhook endpoint
 * POST /webhooks/stripe
 * 
 * CRITICAL NOTES:
 * 1. This endpoint is applied with express.raw() middleware to get raw body
 * 2. Signature verification happens in stripeWebhookMiddleware
 * 3. Must return 200 to acknowledge receipt to Stripe
 * 4. Must return 200 even on errors (to prevent Stripe retry spam)
 */
router.post("/stripe", handleWebhookEvent);

export default router;
