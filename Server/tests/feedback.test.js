import { describe, it, expect } from "vitest";
import request from "supertest";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Feedback Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

describe("POST /api/v1/feedback", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/v1/feedback").send({ rating: 5, comment: "Great!" });
    expect(res.status).toBe(401);
  });

  it("rejects a rating outside 1-5", async () => {
    const { token } = await registerAndLogin("feedback1@test.com");
    const res = await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${token}`).send({ rating: 6, comment: "x" });
    expect(res.status).toBe(400);
  });

  it("submits feedback successfully", async () => {
    const { token } = await registerAndLogin("feedback2@test.com");
    const res = await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "Love this site!" });
    expect(res.status).toBe(200);
    expect(res.body.data.feedback.rating).toBe(5);
  });

  it("upserts — a second submission replaces the first instead of creating a duplicate", async () => {
    const { token } = await registerAndLogin("feedback3@test.com");
    await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${token}`).send({ rating: 2, comment: "First try" });
    const res = await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "Changed my mind" });

    expect(res.status).toBe(200);
    expect(res.body.data.feedback.rating).toBe(5);

    const publicRes = await request(app).get("/api/v1/feedback/public");
    const matches = publicRes.body.data.filter((f) => f.comment === "Changed my mind" || f.comment === "First try");
    expect(matches).toHaveLength(1);
  });
});

describe("GET /api/v1/feedback/public", () => {
  it("only shows feedback rated 4 or higher with a comment", async () => {
    const good = await registerAndLogin("feedbackgood@test.com");
    const bad = await registerAndLogin("feedbackbad@test.com");
    await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${good.token}`).send({ rating: 5, comment: "Excellent" });
    await request(app).post("/api/v1/feedback").set("Authorization", `Bearer ${bad.token}`).send({ rating: 2, comment: "Not great" });

    const res = await request(app).get("/api/v1/feedback/public");
    expect(res.status).toBe(200);
    expect(res.body.data.every((f) => f.rating >= 4)).toBe(true);
  });
});
