import "dotenv/config.js";
import mongoose from "mongoose";
import { validateEnv } from "./src/config/validateEnv.js";

// Must run before app.js is loaded: config/stripe.js builds its client from
// env at import time, so a missing key would otherwise surface as a cryptic
// SDK error instead of a clear "STRIPE_SECRET_KEY is not set" message.
validateEnv();

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./src/config/db.js");
const { startScheduledJobs } = await import("./src/config/scheduledJobs.js");

const PORT = process.env.PORT || 5011;

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 PetCenter server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  startScheduledJobs();
});

// Handle unhandled promise rejections without crashing the server
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Removed process.exit(1) to prevent the server from crashing
  // on third-party stream errors (e.g. Cloudinary invalid image formats).
});

// Graceful shutdown — a deploy/restart/autoscale-down sends SIGTERM; without
// this the process is hard-killed mid-request instead of draining in-flight
// work and closing the DB connection cleanly.
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    console.log("✅ HTTP server closed");
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });

  // Force-exit if something (a stuck connection, a hung request) prevents
  // the graceful path above from ever finishing.
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
