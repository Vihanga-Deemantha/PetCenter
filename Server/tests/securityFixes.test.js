import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import Favorite from "../src/models/Favorite.js";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

describe("Soft-deleted users cannot use a still-valid access token", () => {
  it("rejects a protected request once isDeleted is set, even with an unexpired token", async () => {
    const { userId, token } = await registerAndLogin("softdeleted@test.com");

    // Sanity check: token works before deletion
    const before = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(before.status).toBe(200);

    await User.findByIdAndUpdate(userId, { isDeleted: true });

    const after = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it("bumps tokenVersion on admin soft-delete so the old access token is rejected", async () => {
    const { userId, token } = await registerAndLogin("admindeleted@test.com");
    const before = await User.findById(userId);
    const versionBefore = before.tokenVersion || 0;

    // Simulate the admin controller's soft-delete update directly against the model
    const user = await User.findById(userId);
    user.isDeleted = true;
    user.refreshToken = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const updated = await User.findById(userId);
    expect(updated.tokenVersion).toBe(versionBefore + 1);

    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/favorites/check — malformed items are rejected, not used as a Mongo filter", () => {
  it("ignores entries whose itemType/itemId are query operator objects instead of strings", async () => {
    const { userId, token } = await registerAndLogin("favcheck@test.com");

    const product = await Product.create({
      name: "Test Product",
      description: "desc",
      price: 1000,
      category: "food",
      stock: 5,
      isActive: true,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      compatiblePets: ["dog"],
    });

    await Favorite.create({ userId, itemType: "product", itemId: product._id });

    const maliciousItems = JSON.stringify([{ itemType: { $ne: null }, itemId: { $ne: null } }]);
    const res = await request(app)
      .get(`/api/v1/favorites/check?items=${encodeURIComponent(maliciousItems)}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // A crafted operator object must not resolve to any key in the result
    expect(Object.keys(res.body.data)).toHaveLength(0);
  });

  it("still works normally for well-formed items", async () => {
    const { userId, token } = await registerAndLogin("favcheck2@test.com");
    const product = await Product.create({
      name: "Test Product 2",
      description: "desc",
      price: 1000,
      category: "food",
      stock: 5,
      isActive: true,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      compatiblePets: ["dog"],
    });
    await Favorite.create({ userId, itemType: "product", itemId: product._id });

    const items = JSON.stringify([{ itemType: "product", itemId: product._id.toString() }]);
    const res = await request(app)
      .get(`/api/v1/favorites/check?items=${encodeURIComponent(items)}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[product._id.toString()]).toBe(true);
  });
});

describe("POST /api/v1/donations/create-payment-intent — goal_reached campaigns are closed to new donations", () => {
  it("rejects a donation once the campaign has reached its goal", async () => {
    const { userId } = await registerAndLogin("campaigncreator@test.com");
    const campaign = await Campaign.create({
      title: "Test Campaign",
      description: "desc",
      shortDescription: "short desc",
      goalAmount: 10000,
      raisedAmount: 10000,
      status: "goal_reached",
      category: "medical",
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      createdBy: userId,
    });

    const res = await request(app)
      .post("/api/v1/donations/create-payment-intent")
      .send({ campaignId: campaign._id.toString(), amount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/goal/i);
  });
});
