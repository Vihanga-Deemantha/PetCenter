import "dotenv/config.js";
import app from "./app.js";

const PORT = process.env.PORT || 5011;

const server = app.listen(PORT, () => {
  console.log(`🚀 PetCenter server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// Handle unhandled promise rejections without crashing the server
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Removed process.exit(1) to prevent the server from crashing 
  // on third-party stream errors (e.g. Cloudinary invalid image formats).
});
