import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";

const { default: app } = await import("../app.js");

async function registerAdmin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Admin Test",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  const userId = res.body.data.user._id;
  await User.findByIdAndUpdate(userId, { role: "admin" });
  return { userId, token: res.body.data.accessToken };
}

describe("GET /api/v1/campaigns/admin/all — on-the-fly expiry", () => {
  it("reports a past-deadline active campaign as expired instead of the stale stored status", async () => {
    const { userId, token } = await registerAdmin("campaignadminexpiry@test.com");

    const campaign = await Campaign.create({
      title: "Past Deadline Campaign",
      shortDescription: "short",
      description: "desc",
      goalAmount: 10000,
      category: "medical",
      status: "active",
      createdBy: userId,
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
    });

    const res = await request(app)
      .get("/api/v1/campaigns/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = res.body.data.find((c) => c._id === String(campaign._id));
    expect(found.status).toBe("expired");

    // The stored value itself is untouched — this is a display-time overlay, not a write.
    const stored = await Campaign.findById(campaign._id);
    expect(stored.status).toBe("active");
  });
});
