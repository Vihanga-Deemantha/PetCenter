import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import listingRoutes from "./src/routes/listing.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";

const app = express();

// Connect to MongoDB
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Allow cookies
  })
);
// NoSQL injection sanitization — express-mongo-sanitize is not yet compatible
// with Express v5's read-only req.query. Sanitize at controller level instead.

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Rate Limiting (general) ───────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, message: "PetCenter API is running 🐾", timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/admin", adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
