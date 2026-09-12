import "dotenv/config.js";
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
