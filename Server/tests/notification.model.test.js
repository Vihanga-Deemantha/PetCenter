import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Notification from "../src/models/Notification.js";

// Regression test: "listing_rejected" and "system" notifications were being
// created by admin.controller.js and feedback.controller.js respectively,
// but were missing from this enum — createNotification() swallows the
// resulting ValidationError, so those notifications silently never saved.
describe("Notification schema — type enum", () => {
  const validTypes = [
    "listing_approved",
    "listing_rejected",
    "listing_removed",
    "order_status_changed",
    "donation_campaign_closing",
    "review_received",
    "system",
  ];

  it.each(validTypes)("accepts type '%s'", async (type) => {
    const doc = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type,
      title: "test",
      message: "test",
    });
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it("rejects an unknown type", async () => {
    const doc = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type: "not_a_real_type",
      title: "test",
      message: "test",
    });
    await expect(doc.validate()).rejects.toThrow();
  });
});
