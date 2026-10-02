import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const sendEmailMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../src/utils/sendEmail.js", () => ({
  default: (...args) => sendEmailMock(...args),
}));

const { default: app } = await import("../app.js");

const VALID_USER = {
  name: "Auth Test User",
  email: "authuser3@test.com",
  password: "password123",
  phone: "1234567890",
  location: "Test City",
};

const register = (overrides = {}) =>
  request(app).post("/api/v1/auth/register").send({ ...VALID_USER, ...overrides });

// register, forgot-password, and reset-password are ALL authLimiter-guarded
// (15 req/15 min, shared across every auth route) — kept to its own file to
// stay under that budget. See authRegisterLogin.test.js for the full reasoning.
describe("POST /api/v1/auth/forgot-password + PUT /api/v1/auth/reset-password/:token", () => {
  beforeEach(() => sendEmailMock.mockClear());

  it("returns the same generic message whether or not the email exists", async () => {
    await register({ email: "forgot1@test.com" });
    const existsRes = await request(app).post("/api/v1/auth/forgot-password").send({ email: "forgot1@test.com" });
    const missingRes = await request(app).post("/api/v1/auth/forgot-password").send({ email: "neverexisted@test.com" });

    expect(existsRes.status).toBe(200);
    expect(missingRes.status).toBe(200);
    expect(existsRes.body.data.message).toBe(missingRes.body.data.message);
    expect(sendEmailMock).toHaveBeenCalledTimes(1); // only for the real account
  });

  it("resets the password with a valid token and invalidates existing sessions", async () => {
    const reg = await register({ email: "forgot2@test.com", password: "oldpassword" });
    await request(app).post("/api/v1/auth/forgot-password").send({ email: "forgot2@test.com" });

    const resetUrl = sendEmailMock.mock.calls[0][0].html;
    const resetToken = resetUrl.match(/reset-password\/([a-f0-9]+)/)[1];

    const resetRes = await request(app).put(`/api/v1/auth/reset-password/${resetToken}`).send({ password: "brandnewpassword" });
    expect(resetRes.status).toBe(200);

    // Old access token is now invalid
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${reg.body.data.accessToken}`);
    expect(meRes.status).toBe(401);
  });

  it("rejects an invalid/garbage reset token", async () => {
    const res = await request(app).put("/api/v1/auth/reset-password/not-a-real-token").send({ password: "whatever123" });
    expect(res.status).toBe(400);
  });

  it("rejects reusing an already-consumed reset token", async () => {
    await register({ email: "forgot3@test.com", password: "oldpassword" });
    await request(app).post("/api/v1/auth/forgot-password").send({ email: "forgot3@test.com" });
    const resetUrl = sendEmailMock.mock.calls[0][0].html;
    const resetToken = resetUrl.match(/reset-password\/([a-f0-9]+)/)[1];

    const firstUse = await request(app).put(`/api/v1/auth/reset-password/${resetToken}`).send({ password: "firstnewpassword" });
    expect(firstUse.status).toBe(200);

    const secondUse = await request(app).put(`/api/v1/auth/reset-password/${resetToken}`).send({ password: "secondnewpassword" });
    expect(secondUse.status).toBe(400);
  });
});
