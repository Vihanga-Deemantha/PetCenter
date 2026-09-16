import "dotenv/config.js";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { startScheduledJobs } from "./src/config/scheduledJobs.js";

const PORT = process.env.PORT || 5011;

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 PetCenter server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  startScheduledJobs();

  if (process.env.NODE_ENV === "production" && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.warn(
      "⚠️  SMTP is not configured — password reset emails will fail in production until SMTP_USER/SMTP_PASS are set."
    );
  }
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
