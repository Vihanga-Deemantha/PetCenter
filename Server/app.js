import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";

import authRoutes from "./src/routes/auth.routes.js";
import listingRoutes from "./src/routes/listing.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import campaignRoutes from "./src/routes/campaign.routes.js";
import donationRoutes from "./src/routes/donation.routes.js";
import shelterRoutes from "./src/routes/shelter.routes.js";
import webhookRoutes from "./src/routes/webhook.routes.js";
import ecosystemRoutes from "./src/routes/ecosystem.routes.js";
import favoriteRoutes from "./src/routes/favorite.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import feedbackRoutes from "./src/routes/feedback.routes.js";
import { stripeWebhookMiddleware } from "./src/middleware/stripeWebhook.js";
import errorHandler from "./src/middleware/errorHandler.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";
import { nosqlSanitize } from "./src/middleware/nosqlSanitize.js";
import { getClientOrigins } from "./src/config/clientOrigins.js";

// Building the app has no side effects (no DB connection, no listening) so
// it can be imported safely by tests — server.js is the only entrypoint that
// actually connects to a database and starts the server.
const app = express();

// Render (like most PaaS hosts) terminates TLS at a reverse proxy in front of
// the app. Without this, req.ip is the proxy's address for every visitor —
// so the IP-keyed rate limiters would treat the whole internet as one client
// (and express-rate-limit logs a validation error on every request about the
// X-Forwarded-For header it can't trust). One hop = Render's load balancer.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: getClientOrigins(),
    credentials: true, // Allow cookies
  })
);
// ── Request Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// ── Response Compression ─────────────────────────────────────────────────────
app.use(compression());

// ── Stripe Webhooks (must be BEFORE body parsers) ──────────────────────────────
// Webhooks require raw body for signature verification
app.use(
  "/api/v1/webhooks",
  express.raw({ type: "application/json" }),
  stripeWebhookMiddleware,
  webhookRoutes
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// nosqlSanitize reads/rewrites req.body, so it must run AFTER the body
// parsers above populate it — Express leaves req.body undefined until then,
// which silently no-ops the `if (req.body)` guard and lets every unsanitized
// field straight through to controllers. req.query is populated by Express
// core before any middleware runs, so it's unaffected by this ordering.
app.use(nosqlSanitize);

// ── Rate Limiting (general) ───────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, message: "PetCenter API is running 🐾", timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/shelters", shelterRoutes);
app.use("/api/v1/ecosystem", ecosystemRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
