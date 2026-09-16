import { describe, it, expect, vi, beforeEach } from "vitest";
import Campaign from "../src/models/Campaign.js";
import Donation from "../src/models/Donation.js";
import User from "../src/models/User.js";

// The reconciliation job asks Stripe directly for a stale "pending"
// donation's real status — stub that network call so the test exercises
// the job's own logic (grace window, status mapping) deterministically.
const retrieveMock = vi.fn();
vi.mock("../src/config/stripe.js", () => ({
  default: { paymentIntents: { retrieve: (...args) => retrieveMock(...args) } },
}));

const { reconcilePendingDonations } = await import("../src/config/scheduledJobs.js");

async function makeCampaign(overrides = {}) {
  const admin = await User.create({
    name: "Admin",
    email: `admin_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    role: "admin",
  });
  return Campaign.create({
    title: "Campaign",
    shortDescription: "short",
    description: "desc",
    goalAmount: 10000,
    category: "medical",
    status: "active",
    createdBy: admin._id,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    ...overrides,
  });
}

const STALE_CREATED_AT = new Date(Date.now() - 20 * 60 * 1000); // past the 15-min grace window

describe("reconcilePendingDonations", () => {
  beforeEach(() => retrieveMock.mockReset());

  it("completes a stale pending donation whose PaymentIntent actually succeeded on Stripe", async () => {
    const campaign = await makeCampaign();
    const donation = await Donation.create({
      campaignId: campaign._id,
      amount: 1500,
      stripePaymentIntentId: "pi_test_succeeded",
      status: "pending",
      displayName: "Donor",
      createdAt: STALE_CREATED_AT,
    });

    retrieveMock.mockResolvedValue({
      id: "pi_test_succeeded",
      amount: 1500,
      status: "succeeded",
      metadata: { campaignId: String(campaign._id), userId: "", displayName: "Donor", message: "" },
    });

    await reconcilePendingDonations();

    const updatedDonation = await Donation.findById(donation._id);
    expect(updatedDonation.status).toBe("completed");

    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign.raisedAmount).toBe(1500);
  });

  it("marks a stale pending donation failed if Stripe reports the intent canceled", async () => {
    const campaign = await makeCampaign();
    const donation = await Donation.create({
      campaignId: campaign._id,
      amount: 800,
      stripePaymentIntentId: "pi_test_canceled",
      status: "pending",
      displayName: "Donor",
      createdAt: STALE_CREATED_AT,
    });

    retrieveMock.mockResolvedValue({
      id: "pi_test_canceled",
      status: "canceled",
      metadata: { type: "donation" },
    });

    await reconcilePendingDonations();

    const updated = await Donation.findById(donation._id);
    expect(updated.status).toBe("failed");
  });

  it("leaves a recently-created pending donation alone (still within the grace window)", async () => {
    const donation = await Donation.create({
      campaignId: (await makeCampaign())._id,
      amount: 800,
      stripePaymentIntentId: "pi_test_fresh",
      status: "pending",
      displayName: "Donor",
    });

    await reconcilePendingDonations();

    expect(retrieveMock).not.toHaveBeenCalled();
    const updated = await Donation.findById(donation._id);
    expect(updated.status).toBe("pending");
  });
});
