import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "../src/models/Campaign.js";
import Donation from "../src/models/Donation.js";
import User from "../src/models/User.js";

// Load environment variables
dotenv.config();

const runTests = async () => {
  console.log("🧪 Starting Automated Verification for Campaign Delete Guard...");

  // Connect to DB
  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!dbUri) {
    console.error("❌ MONGODB_URI is not defined in env variables.");
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log("🔌 Connected to database for testing.");

  let testUser = null;

  try {
    // 0. Set up a dummy creator User
    testUser = await User.findOne({ role: "admin" });
    if (!testUser) {
      testUser = await User.create({
        name: "Test Admin",
        email: `testadmin_${Date.now()}@test.com`,
        password: "password123",
        phone: "1234567890",
        location: "Test City",
        role: "admin",
      });
      console.log(`👤 Created temporary test admin: ${testUser.email}`);
    } else {
      console.log(`👤 Using existing admin: ${testUser.email}`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 🏁 Quadrant 1: draft + 0 donations (Deletion should succeed)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶️ Testing Quadrant 1: draft campaign with 0 donations...");
    const campaign1 = await Campaign.create({
      title: "Test Campaign Q1",
      shortDescription: "Short description for Q1",
      description: "Detailed description for Q1",
      goalAmount: 10000,
      category: "medical",
      status: "draft",
      createdBy: testUser._id,
      images: [{ url: "http://example.com/img.jpg", publicId: "img1" }],
    });

    // Attempt Mongoose delete - should work
    await campaign1.deleteOne();
    console.log("✅ Quadrant 1 passed: Deletion of draft campaign with 0 donations succeeded.");

    // ──────────────────────────────────────────────────────────────────────────
    // 🏁 Quadrant 2: draft + 1 donation (Deletion should fail)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶️ Testing Quadrant 2: draft campaign with 1 donation...");
    const campaign2 = await Campaign.create({
      title: "Test Campaign Q2",
      shortDescription: "Short description for Q2",
      description: "Detailed description for Q2",
      goalAmount: 15000,
      category: "food",
      status: "draft",
      createdBy: testUser._id,
      images: [{ url: "http://example.com/img.jpg", publicId: "img2" }],
    });

    // Create a donation
    const donation2 = await Donation.create({
      campaignId: campaign2._id,
      amount: 1000,
      stripePaymentIntentId: `pi_test_${Date.now()}_q2`,
      status: "pending", // even pending/failed/refunded count
      displayName: "Donor Q2",
    });

    try {
      await campaign2.deleteOne();
      console.error("❌ Quadrant 2 failed: Deletion succeeded when it should have failed.");
      throw new Error("Quadrant 2 failed");
    } catch (err) {
      if (err.message.includes("Cannot delete a campaign with associated donations")) {
        console.log("✅ Quadrant 2 passed: Deletion blocked with correct message: " + err.message);
      } else {
        console.error("❌ Quadrant 2 failed: Threw incorrect error:", err.message);
        throw err;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 🏁 Quadrant 3: public + 0 donations (Deletion should fail)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶️ Testing Quadrant 3: public (active) campaign with 0 donations...");
    const campaign3 = await Campaign.create({
      title: "Test Campaign Q3",
      shortDescription: "Short description for Q3",
      description: "Detailed description for Q3",
      goalAmount: 20000,
      category: "shelter",
      status: "active",
      createdBy: testUser._id,
      images: [{ url: "http://example.com/img.jpg", publicId: "img3" }],
    });

    try {
      await campaign3.deleteOne();
      console.error("❌ Quadrant 3 failed: Deletion succeeded when it should have failed.");
      throw new Error("Quadrant 3 failed");
    } catch (err) {
      if (err.message.includes("Cannot delete a campaign that is not in draft status")) {
        console.log("✅ Quadrant 3 passed: Deletion blocked with correct message: " + err.message);
      } else {
        console.error("❌ Quadrant 3 failed: Threw incorrect error:", err.message);
        throw err;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 🏁 Quadrant 4: public + 1 donation (Deletion should fail)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n▶️ Testing Quadrant 4: public (active) campaign with 1 donation...");
    const campaign4 = await Campaign.create({
      title: "Test Campaign Q4",
      shortDescription: "Short description for Q4",
      description: "Detailed description for Q4",
      goalAmount: 25000,
      category: "rescue",
      status: "active",
      createdBy: testUser._id,
      images: [{ url: "http://example.com/img.jpg", publicId: "img4" }],
    });

    // Create a donation
    const donation4 = await Donation.create({
      campaignId: campaign4._id,
      amount: 2500,
      stripePaymentIntentId: `pi_test_${Date.now()}_q4`,
      status: "completed",
      displayName: "Donor Q4",
    });

    try {
      await campaign4.deleteOne();
      console.error("❌ Quadrant 4 failed: Deletion succeeded when it should have failed.");
      throw new Error("Quadrant 4 failed");
    } catch (err) {
      if (err.message.includes("Cannot delete a campaign that is not in draft status")) {
        console.log("✅ Quadrant 4 passed: Deletion blocked with correct message: " + err.message);
      } else {
        console.error("❌ Quadrant 4 failed: Threw incorrect error:", err.message);
        throw err;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 🏁 Clean Up
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n🧹 Cleaning up test database records...");
    // Bypass Mongoose hooks by using native mongodb driver collections directly
    await Campaign.collection.deleteMany({
      _id: { $in: [campaign2._id, campaign3._id, campaign4._id] },
    });
    await Donation.collection.deleteMany({
      _id: { $in: [donation2._id, donation4._id] },
    });

    console.log("\n🎉 ALL CAMPAIGN DELETE GUARD TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test Suite Encountered Unhandled Error:", error);
    process.exit(1);
  }
};

runTests();
