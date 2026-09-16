import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";

// The real OAuth2Client.verifyIdToken() calls out to Google's servers to
// check the token's signature — tests stub it so a fixed payload comes back
// without any network access, while still exercising the real find-or-create
// and token-issuing logic in auth.controller.js.
let mockPayload;
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    async verifyIdToken() {
      if (!mockPayload) throw new Error("invalid token");
      return { getPayload: () => mockPayload };
    }
  },
}));

const { default: app } = await import("../app.js");

describe("POST /api/v1/auth/google", () => {
  it("creates a new account on first sign-in", async () => {
    mockPayload = { sub: "google-sub-1", email: "newgoogle@test.com", name: "Nia Fernando", picture: "https://example.com/p.jpg" };

    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("newgoogle@test.com");
    expect(res.body.data.accessToken).toBeTruthy();

    const created = await User.findOne({ email: "newgoogle@test.com" }).select("+googleId");
    expect(created.authProvider).toBe("google");
    expect(created.googleId).toBe("google-sub-1");
  });

  it("logs an existing Google user back in on a later sign-in", async () => {
    mockPayload = { sub: "google-sub-2", email: "returning@test.com", name: "Returning User", picture: "" };
    await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    expect(res.status).toBe(200);
    const count = await User.countDocuments({ email: "returning@test.com" });
    expect(count).toBe(1);
  });

  it("links Google sign-in to an existing local account with the same email", async () => {
    const local = await User.create({
      name: "Local User",
      email: "linked@test.com",
      password: "password123",
      phone: "0771234567",
      location: "Colombo",
    });

    mockPayload = { sub: "google-sub-3", email: "linked@test.com", name: "Local User", picture: "" };
    const res = await request(app).post("/api/v1/auth/google").send({ credential: "fake-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(String(local._id));

    const updated = await User.findById(local._id).select("+googleId");
    expect(updated.googleId).toBe("google-sub-3");
    expect(updated.authProvider).toBe("local");
  });

  it("rejects an invalid credential", async () => {
    mockPayload = null;

    const res = await request(app).post("/api/v1/auth/google").send({ credential: "garbage" });

    expect(res.status).toBe(401);
  });

  it("rejects a missing credential", async () => {
    const res = await request(app).post("/api/v1/auth/google").send({});
    expect(res.status).toBe(400);
  });
});
