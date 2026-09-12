import { describe, it, expect } from "vitest";
import Campaign from "../src/models/Campaign.js";
import Donation from "../src/models/Donation.js";
import User from "../src/models/User.js";

// Campaigns can only be deleted while still in "draft" status and only if
// no donation (even a failed/refunded one) has ever been recorded against
// them — donations are financial records that must not disappear.
describe("Campaign delete guard", () => {
  const makeAdmin = () =>
    User.create({
      name: "Test Admin",
      email: `admin_${Date.now()}_${Math.random()}@test.com`,
      password: "password123",
      phone: "1234567890",
      location: "Test City",
      role: "admin",
    });

  const makeCampaign = (createdBy, overrides = {}) =>
    Campaign.create({
      title: "Test Campaign",
      shortDescription: "Short description",
      description: "Detailed description",
      goalAmount: 10000,
      category: "medical",
      status: "draft",
      createdBy,
      images: [{ url: "http://example.com/img.jpg", publicId: "img1" }],
      ...overrides,
    });

  it("allows deleting a draft campaign with zero donations", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin._id);

    await expect(campaign.deleteOne()).resolves.toBeDefined();
  });

  it("blocks deleting a draft campaign that has a donation", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin._id);
    await Donation.create({
      campaignId: campaign._id,
      amount: 1000,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      status: "pending",
      displayName: "Donor",
    });

    await expect(campaign.deleteOne()).rejects.toThrow(
      /Cannot delete a campaign with associated donations/
    );
  });

  it("blocks deleting a non-draft campaign even with zero donations", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin._id, { status: "active" });

    await expect(campaign.deleteOne()).rejects.toThrow(
      /Cannot delete a campaign that is not in draft status/
    );
  });

  it("blocks deleting a non-draft campaign that also has a donation", async () => {
    const admin = await makeAdmin();
    const campaign = await makeCampaign(admin._id, { status: "active" });
    await Donation.create({
      campaignId: campaign._id,
      amount: 2500,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      status: "completed",
      displayName: "Donor",
    });

    await expect(campaign.deleteOne()).rejects.toThrow(
      /Cannot delete a campaign that is not in draft status/
    );
  });
});
