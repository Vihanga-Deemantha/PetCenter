import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import Product from "../src/models/Products.js";
import EcosystemBuild from "../src/models/EcosystemBuild.js";
import Cart from "../src/models/Cart.js";

dotenv.config();

const API_BASE = "http://localhost:5011/api/v1";

const runTests = async () => {
  console.log("🧪 Starting Automated Verification for Phase 4 Ecosystem Builder...");

  // Connect to DB
  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!dbUri) {
    console.error("❌ MONGODB_URI is not defined in env variables.");
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log("🔌 Connected to database for testing helper verification.");

  try {
    // ─── Set up Test Users & Tokens ──────────────────────────────────────────
    let user1 = await User.findOne({ email: "testuser124@example.com" });
    if (!user1) {
      user1 = await User.create({
        name: "Test User One",
        email: "testuser124@example.com",
        password: "password123",
        phone: "1234567890",
        location: "Test City",
        role: "user",
      });
    }
    const token1 = jwt.sign({ id: user1._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

    let user2 = await User.findOne({ email: "kawaki12098@gmail.com" });
    if (!user2) {
      user2 = await User.create({
        name: "Test User Two",
        email: "kawaki12098@gmail.com",
        password: "password123",
        phone: "1234567891",
        location: "Test City 2",
        role: "user",
      });
    }
    const token2 = jwt.sign({ id: user2._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Test Admin",
        email: "admin1@petcenter.com",
        password: "password123",
        phone: "1234567890",
        location: "Test City",
        role: "admin",
      });
    }
    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

    console.log("👤 Test tokens generated successfully.");

    // Helper fetch function
    const apiCall = async (url, method = "GET", body = null, token = null) => {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const options = {
        method,
        headers,
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(`${API_BASE}${url}`, options);
      const data = await response.json();
      return { status: response.status, data };
    };

    // ─── 1. Get Pet Config List ──────────────────────────────────────────────
    console.log("\n▶️ 1. Fetching supported pets list...");
    const r1 = await apiCall("/ecosystem/pets");
    if (r1.status !== 200 || !r1.data.success || !Array.isArray(r1.data.data)) {
      throw new Error(`Failed to fetch pets list: ${JSON.stringify(r1.data)}`);
    }
    console.log(`✅ Passed: Fetched ${r1.data.data.length} supported pet profiles.`);

    // ─── 2. Get Pet Config details ───────────────────────────────────────────
    console.log("\n▶️ 2. Fetching fish habitat config...");
    const r2 = await apiCall("/ecosystem/pets/fish/config");
    if (r2.status !== 200 || !r2.data.success || r2.data.data.displayName !== "Fish") {
      throw new Error(`Failed to fetch fish config: ${JSON.stringify(r2.data)}`);
    }
    console.log("✅ Passed: Fetched fish configuration detail.");

    // ─── 3. Find Products for Build ──────────────────────────────────────────
    console.log("\n▶️ 3. Querying products by tags and compatibility...");
    
    // Find tank product
    const tankProduct = await Product.findOne({ compatiblePets: "fish", tags: "tank" });
    if (!tankProduct) throw new Error("Tank product not found. Ensure DB is seeded.");
    
    // Find filter product
    const filterProduct = await Product.findOne({ compatiblePets: "fish", tags: "filter" });
    if (!filterProduct) throw new Error("Filter product not found. Ensure DB is seeded.");

    // Find heater product
    const heaterProduct = await Product.findOne({ compatiblePets: "fish", tags: "heater" });
    if (!heaterProduct) throw new Error("Heater product not found. Ensure DB is seeded.");

    console.log(`✅ Found required products:\n  - Tank: ${tankProduct.name} (${tankProduct._id})\n  - Filter: ${filterProduct.name} (${filterProduct._id})\n  - Heater: ${heaterProduct.name} (${heaterProduct._id})`);

    // ─── 4. Create Saved Build (Complete) ────────────────────────────────────
    console.log("\n▶️ 4. Creating complete fish ecosystem build...");
    const buildBodyComplete = {
      name: "Grand Aquarium Setup",
      petType: "fish",
      selections: [
        { categoryKey: "tank", productId: tankProduct._id },
        { categoryKey: "filter", productId: filterProduct._id },
        { categoryKey: "heater", productId: heaterProduct._id }
      ]
    };
    const r4 = await apiCall("/ecosystem/builds", "POST", buildBodyComplete, token1);
    if (r4.status !== 201 || !r4.data.success) {
      throw new Error(`Failed to create build: ${JSON.stringify(r4.data)}`);
    }
    const completeBuildId = r4.data.data._id;
    console.log(`✅ Passed: Build created successfully with ID: ${completeBuildId}`);

    // ─── 5. Create Incomplete Build ──────────────────────────────────────────
    console.log("\n▶️ 5. Creating incomplete fish build (missing heater)...");
    const buildBodyIncomplete = {
      name: "Incomplete Fish Setup",
      petType: "fish",
      selections: [
        { categoryKey: "tank", productId: tankProduct._id },
        { categoryKey: "filter", productId: filterProduct._id }
      ]
    };
    const r5 = await apiCall("/ecosystem/builds", "POST", buildBodyIncomplete, token1);
    if (r5.status !== 201 || !r5.data.success) {
      throw new Error(`Failed to create incomplete build: ${JSON.stringify(r5.data)}`);
    }
    const incompleteBuildId = r5.data.data._id;
    console.log(`✅ Passed: Incomplete build created successfully with ID: ${incompleteBuildId}`);

    // ─── 6. Attempt to Publish Incomplete Build ──────────────────────────────
    console.log("\n▶️ 6. Attempting to publish incomplete build (should fail)...");
    const r6 = await apiCall(`/ecosystem/builds/${incompleteBuildId}/publish`, "PATCH", {}, token1);
    if (r6.status !== 400) {
      throw new Error(`Expected publish to fail with 400 but got ${r6.status}: ${JSON.stringify(r6.data)}`);
    }
    console.log(`✅ Passed: Publish blocked with 400 Bad Request. Msg: "${r6.data.message}"`);

    // ─── 7. Publish Complete Build ───────────────────────────────────────────
    console.log("\n▶️ 7. Publishing complete build...");
    const r7 = await apiCall(`/ecosystem/builds/${completeBuildId}/publish`, "PATCH", {}, token1);
    if (r7.status !== 200 || !r7.data.success || !r7.data.data.isPublished) {
      throw new Error(`Failed to publish build: ${JSON.stringify(r7.data)}`);
    }
    console.log("✅ Passed: Complete build published to the gallery.");

    // ─── 8. Fetch Gallery ────────────────────────────────────────────────────
    console.log("\n▶️ 8. Querying public gallery for fish builds...");
    const r8 = await apiCall("/ecosystem/gallery?petType=fish");
    if (r8.status !== 200 || !r8.data.success || r8.data.data.length === 0) {
      throw new Error(`Expected build in gallery but got empty: ${JSON.stringify(r8.data)}`);
    }
    const galleryBuild = r8.data.data.find(b => b._id === completeBuildId);
    if (!galleryBuild) {
      throw new Error(`Our published build ${completeBuildId} was not found in the gallery.`);
    }
    console.log(`✅ Passed: Found published build in gallery. Title: "${galleryBuild.name}" by User: "${galleryBuild.userId.name}"`);

    // ─── 9. Get Gallery Build Detail ─────────────────────────────────────────
    console.log("\n▶️ 9. Fetching single gallery build details...");
    const r9 = await apiCall(`/ecosystem/gallery/${completeBuildId}`);
    if (r9.status !== 200 || !r9.data.success || r9.data.data.name !== "Grand Aquarium Setup") {
      throw new Error(`Failed to get build detail: ${JSON.stringify(r9.data)}`);
    }
    console.log("✅ Passed: Successfully fetched detail with populated data.");

    // ─── 10. Clone Build ─────────────────────────────────────────────────────
    console.log("\n▶️ 10. Cloning published build with User 2...");
    const r10 = await apiCall(`/ecosystem/gallery/${completeBuildId}/clone`, "POST", {}, token2);
    if (r10.status !== 201 || !r10.data.success) {
      throw new Error(`Failed to clone build: ${JSON.stringify(r10.data)}`);
    }
    const clonedBuildId = r10.data.data._id;
    console.log(`✅ Passed: Build cloned. Cloned Build ID: ${clonedBuildId}`);

    // Verify original build cloneCount incremented
    const updatedOriginal = await EcosystemBuild.findById(completeBuildId);
    if (updatedOriginal.cloneCount !== 1) {
      throw new Error(`Expected cloneCount to be 1, but got ${updatedOriginal.cloneCount}`);
    }
    console.log(`✅ Passed: original build cloneCount correctly incremented to ${updatedOriginal.cloneCount}.`);

    // ─── 11. Bulk Add to Cart ────────────────────────────────────────────────
    console.log("\n▶️ 11. Testing bulk add to cart with cloned selections...");
    // Clear cart first for user2
    await Cart.deleteOne({ userId: user2._id });
    
    const cartItems = [
      { productId: tankProduct._id, quantity: 1 },
      { productId: filterProduct._id, quantity: 1 },
      { productId: heaterProduct._id, quantity: 1 }
    ];
    const r11 = await apiCall("/cart/bulk", "POST", { items: cartItems }, token2);
    if (r11.status !== 200 || !r11.data.success || r11.data.data.itemCount !== 3) {
      throw new Error(`Failed to bulk add to cart: ${JSON.stringify(r11.data)}`);
    }
    console.log(`✅ Passed: 3 items successfully added to cart. Item count in cart is ${r11.data.data.itemCount}.`);

    // ─── 12. Admin Get Ecosystem Builds ──────────────────────────────────────
    console.log("\n▶️ 12. Fetching published builds for moderation (Admin only)...");
    const r12 = await apiCall("/admin/ecosystem/builds", "GET", null, adminToken);
    if (r12.status !== 200 || !r12.data.success || r12.data.data.length === 0) {
      throw new Error(`Failed to get builds as admin: ${JSON.stringify(r12.data)}`);
    }
    console.log(`✅ Passed: Admin retrieved ${r12.data.data.length} published builds for moderation.`);

    // ─── 13. Admin Unpublish Build ───────────────────────────────────────────
    console.log("\n▶️ 13. Unpublishing build as Admin...");
    const r13 = await apiCall(`/admin/ecosystem/builds/${completeBuildId}/unpublish`, "PATCH", {}, adminToken);
    if (r13.status !== 200 || !r13.data.success || r13.data.data.build.isPublished !== false) {
      throw new Error(`Failed to unpublish build as admin: ${JSON.stringify(r13.data)}`);
    }
    console.log("✅ Passed: Admin successfully unpublished the build.");

    // ─── 14. Verify Gallery is Empty Again ───────────────────────────────────
    console.log("\n▶️ 14. Checking gallery again...");
    const r14 = await apiCall("/ecosystem/gallery?petType=fish");
    const found = r14.data.data?.some(b => b._id === completeBuildId);
    if (found) {
      throw new Error("Build is still visible in gallery after being unpublished!");
    }
    console.log("✅ Passed: Build is no longer visible in public gallery.");

    // ─── Clean Up ────────────────────────────────────────────────────────────
    console.log("\n🧹 Cleaning up test database records...");
    await EcosystemBuild.deleteMany({
      _id: { $in: [completeBuildId, incompleteBuildId, clonedBuildId] }
    });
    await Cart.deleteOne({ userId: user2._id });

    console.log("\n🎉 ALL PHASE 4 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test Suite Encountered Unhandled Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
