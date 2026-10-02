import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import Donation from "../src/models/Donation.js";

const { default: app } = await import("../app.js");

async function makeAdmin() {
  const user = await User.create({
    name: "Admin",
    email: `admin_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    role: "admin",
  });
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "password123" });
  return { userId: user._id, token: res.body.data.accessToken };
}

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Campaign Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeCampaign(createdBy, overrides = {}) {
  return Campaign.create({
    title: "Campaign",
    shortDescription: "short",
    description: "desc",
    goalAmount: 10000,
    category: "medical",
    status: "draft",
    createdBy,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    ...overrides,
  });
}

describe("POST /api/v1/campaigns/admin — admin only, requires an image", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadmincampaign@test.com");
    const res = await request(app).post("/api/v1/campaigns/admin").set("Authorization", `Bearer ${token}`).send({ title: "x" });
    expect(res.status).toBe(403);
  });

  it("rejects creating a campaign with no images", async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .post("/api/v1/campaigns/admin")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "x", shortDescription: "s", description: "d", goalAmount: 10000, category: "medical" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/v1/campaigns/admin/:id — update", () => {
  it("updates allowed fields on a draft campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    const res = await request(app)
      .put(`/api/v1/campaigns/admin/${campaign._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "Renamed Campaign", goalAmount: 20000 });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Renamed Campaign");
    expect(res.body.data.goalAmount).toBe(20000);
  });

  it("refuses to change the goal amount once a donation has been received", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "active" });
    await Donation.create({
      campaignId: campaign._id,
      amount: 500,
      stripePaymentIntentId: `pi_donor_${Date.now()}`,
      status: "completed",
      displayName: "Donor",
    });

    const res = await request(app)
      .put(`/api/v1/campaigns/admin/${campaign._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ goalAmount: 99999 });
    expect(res.status).toBe(400);
  });

  it("refuses to leave the campaign with zero images", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    const res = await request(app)
      .put(`/api/v1/campaigns/admin/${campaign._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ removeImageIds: ["a"] });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/campaigns/admin/:id/publish", () => {
  it("publishes a draft campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "draft" });
    const res = await request(app).patch(`/api/v1/campaigns/admin/${campaign._id}/publish`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("active");
  });

  it("refuses to publish an already-active campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "active" });
    const res = await request(app).patch(`/api/v1/campaigns/admin/${campaign._id}/publish`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/campaigns/admin/:id/close", () => {
  it("requires a close reason", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "active" });
    const res = await request(app).patch(`/api/v1/campaigns/admin/${campaign._id}/close`).set("Authorization", `Bearer ${admin.token}`).send({});
    expect(res.status).toBe(400);
  });

  it("closes an active campaign with a reason", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "active" });
    const res = await request(app)
      .patch(`/api/v1/campaigns/admin/${campaign._id}/close`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ closeReason: "Goal achieved early" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("closed");
  });

  it("refuses to close a draft campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "draft" });
    const res = await request(app)
      .patch(`/api/v1/campaigns/admin/${campaign._id}/close`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ closeReason: "x" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/campaigns/:id/donors", () => {
  it("lists only completed donations, paginated", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "active" });
    await Donation.create({ campaignId: campaign._id, amount: 500, stripePaymentIntentId: `pi_a_${Date.now()}`, status: "completed", displayName: "Alice" });
    await Donation.create({ campaignId: campaign._id, amount: 700, stripePaymentIntentId: `pi_b_${Date.now()}`, status: "pending", displayName: "Bob" });

    const res = await request(app).get(`/api/v1/campaigns/${campaign._id}/donors`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].displayName).toBe("Alice");
  });
});

describe("GET /api/v1/campaigns — public listing", () => {
  it("excludes draft campaigns", async () => {
    const admin = await makeAdmin();
    await makeCampaign(admin.userId, { title: "Draft One", status: "draft" });
    await makeCampaign(admin.userId, { title: "Active One", status: "active" });

    const res = await request(app).get("/api/v1/campaigns");
    expect(res.status).toBe(200);
    expect(res.body.data.every((c) => c.title !== "Draft One")).toBe(true);
  });
});
