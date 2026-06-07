import stripe from "../config/stripe.js";

/**
 * Verify Stripe webhook signature
 * CRITICAL: Must be called with raw body, not parsed JSON
 * 
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe-Signature header
 * @returns {object} Verified event object
 */
export const verifyWebhookSignature = (body, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
};
