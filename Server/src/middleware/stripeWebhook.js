import { verifyWebhookSignature } from "../utils/webhookVerify.js";

/**
 * Middleware to verify Stripe webhook signature
 * CRITICAL: This must be applied BEFORE body parsers
 * Express app setup: app.use(express.raw(...), stripeWebhookMiddleware, express.json())
 */
export const stripeWebhookMiddleware = (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(401).json({ error: "Missing Stripe signature header" });
    }

    // Get raw body from express.raw() middleware
    const rawBody = req.body;

    // Verify signature
    const event = verifyWebhookSignature(rawBody, signature);

    // Attach verified event to request
    req.stripeEvent = event;

    next();
  } catch (error) {
    console.error("Webhook verification failed:", error.message);
    return res.status(401).json({ error: error.message });
  }
};
