import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import Donation from "../src/models/Donation.js";

const createMock = vi.fn();
vi.mock("../src/config/stripe.js", () => ({
  default: { paymentIntents: { create: (...args) => createMock(...args) } },
}));

const { default: app } = await import("../app.js");

beforeEach(() => createMock.mockReset());

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
    name: "Donation Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeCampaign(createdBy, overrides = {}) {
  return Campaign.create({
    title: "Donatable Campaign",
    shortDescription: "short",
    description: "desc",
    goalAmount: 10000,
    category: "medical",
    status: "active",
    createdBy,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    ...overrides,
  });
}

describe("POST /api/v1/donations/create-payment-intent", () => {
  it("rejects an amount below 50 cents", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    const res = await request(app).post("/api/v1/donations/create-payment-intent").send({ campaignId: campaign._id, amount: 10 });
    expect(res.status).toBe(400);
  });

  it("rejects a closed campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "closed", closeReason: "done" });
    const res = await request(app).post("/api/v1/donations/create-payment-intent").send({ campaignId: campaign._id, amount: 500 });
    expect(res.status).toBe(400);
  });

  it("rejects a draft campaign", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId, { status: "draft" });
    const res = await request(app).post("/api/v1/donations/create-payment-intent").send({ campaignId: campaign._id, amount: 500 });
    expect(res.status).toBe(400);
  });

  it("creates a pending donation + PaymentIntent for an anonymous donor", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    createMock.mockResolvedValue({ id: "pi_donation_anon", client_secret: "secret_123" });

    const res = await request(app)
      .post("/api/v1/donations/create-payment-intent")
      .send({ campaignId: campaign._id, amount: 1000, displayName: "Anon Donor" });

    expect(res.status).toBe(200);
    expect(res.body.data.clientSecret).toBe("secret_123");

    const donation = await Donation.findOne({ stripePaymentIntentId: "pi_donation_anon" });
    expect(donation.status).toBe("pending");
    expect(donation.userId).toBeNull();
    expect(donation.displayName).toBe("Anon Donor");
  });

  it("attaches the logged-in user's id when authenticated", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    const donor = await registerAndLogin("donorlogged@test.com");
    createMock.mockResolvedValue({ id: "pi_donation_logged", client_secret: "secret_456" });

    await request(app)
      .post("/api/v1/donations/create-payment-intent")
      .set("Authorization", `Bearer ${donor.token}`)
      .send({ campaignId: campaign._id, amount: 1000 });

    const donation = await Donation.findOne({ stripePaymentIntentId: "pi_donation_logged" });
    expect(donation.userId.toString()).toBe(donor.userId.toString());
  });
});

describe("GET /api/v1/donations/my-donations", () => {
  it("only returns the caller's own completed donations", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    const a = await registerAndLogin("mydon1@test.com");
    const b = await registerAndLogin("mydon2@test.com");
    await Donation.create({ campaignId: campaign._id, userId: a.userId, amount: 500, stripePaymentIntentId: `pi_a_${Date.now()}`, status: "completed", displayName: "A" });
    await Donation.create({ campaignId: campaign._id, userId: a.userId, amount: 500, stripePaymentIntentId: `pi_a2_${Date.now()}`, status: "pending", displayName: "A" });
    await Donation.create({ campaignId: campaign._id, userId: b.userId, amount: 500, stripePaymentIntentId: `pi_b_${Date.now()}`, status: "completed", displayName: "B" });

    const res = await request(app).get("/api/v1/donations/my-donations").set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1); // not the pending one, not B's
  });
});

describe("GET /api/v1/donations/admin/all", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadmindonation@test.com");
    const res = await request(app).get("/api/v1/donations/admin/all").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("lists all donations for an admin, filterable by status", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin.userId);
    await Donation.create({ campaignId: campaign._id, amount: 500, stripePaymentIntentId: `pi_x_${Date.now()}`, status: "completed", displayName: "X" });
    await Donation.create({ campaignId: campaign._id, amount: 500, stripePaymentIntentId: `pi_y_${Date.now()}`, status: "pending", displayName: "Y" });

    const res = await request(app).get("/api/v1/donations/admin/all?status=completed").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((d) => d.status === "completed")).toBe(true);
  });
});
