import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uriFile = path.join(__dirname, ".mongo-test-uri");

// A handful of secrets the app reads from env at import time; tests never
// touch a real Stripe/Cloudinary account, but the modules still need *some*
// value to initialize without throwing.
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.STRIPE_SECRET_KEY ||= "sk_test_placeholder";
process.env.CLOUDINARY_CLOUD_NAME ||= "test";
process.env.CLOUDINARY_API_KEY ||= "test";
process.env.CLOUDINARY_API_SECRET ||= "test";
process.env.GOOGLE_CLIENT_ID ||= "test-google-client-id";
process.env.NODE_ENV = "test";

// Connects to the single MongoMemoryServer instance globalSetup.js started
// for the whole run (not a new one per file) — see tests/globalSetup.js.
beforeAll(async () => {
  const uri = fs.readFileSync(uriFile, "utf-8").trim();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
