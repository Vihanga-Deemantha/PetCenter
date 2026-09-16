import mongoose from "mongoose";

const MAX_RETRIES = 5;

// Retries with exponential backoff before giving up — a transient DNS blip
// or an Atlas failover right at boot shouldn't crash-loop the whole process
// on the very first attempt.
const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

    if (attempt >= MAX_RETRIES) {
      console.error("❌ MongoDB connection failed after maximum retries — exiting.");
      process.exit(1);
      return;
    }

    const delayMs = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s, 16s...
    console.log(`⏳ Retrying MongoDB connection in ${delayMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await connectDB(attempt + 1);
  }
};

export default connectDB;
