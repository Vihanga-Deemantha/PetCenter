import { describe, it, expect } from "vitest";
import request from "supertest";

const { default: app } = await import("../app.js");

const VALID_USER = {
  name: "Auth Test User",
  email: "authuser2@test.com",
  password: "password123",
  phone: "1234567890",
  location: "Test City",
};

const register = (overrides = {}) =>
  request(app).post("/api/v1/auth/register").send({ ...VALID_USER, ...overrides });

// register is the only authLimiter-guarded route this file uses repeatedly;
// refresh-token is too (but only once), so keep this file's register count
// modest — see authRegisterLogin.test.js for why.
describe("POST /api/v1/auth/refresh-token", () => {
  it("rotates the refresh token and issues a new access token", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({ ...VALID_USER, email: "refresh1@test.com" });

    const res = await agent.post("/api/v1/auth/refresh-token");
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("rejects when there is no refresh token cookie", async () => {
    const res = await request(app).post("/api/v1/auth/refresh-token");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("clears the refresh token so it can no longer be used to refresh", async () => {
    const agent = request.agent(app);
    const reg = await agent.post("/api/v1/auth/register").send({ ...VALID_USER, email: "logout1@test.com" });
    const token = reg.body.data.accessToken;

    const logoutRes = await agent.post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const refreshRes = await agent.post("/api/v1/auth/refresh-token");
    expect(refreshRes.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the authenticated user's profile", async () => {
    const reg = await register({ email: "me1@test.com" });
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${reg.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me1@test.com");
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/auth/profile", () => {
  it("updates only the allowed fields", async () => {
    const reg = await register({ email: "profile1@test.com" });
    const token = reg.body.data.accessToken;

    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name", phone: "9998887777", email: "hijacked@test.com", role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(res.body.data.phone).toBe("9998887777");
    // email/role are not in the allowlist — must be unchanged
    expect(res.body.data.email).toBe("profile1@test.com");
    expect(res.body.data.role).toBe("user");
  });
});

// change-password itself is NOT behind authLimiter (only register is, to set
// up each test's user), so this fits comfortably in the same file.
describe("PUT /api/v1/auth/change-password", () => {
  it("changes the password and invalidates other sessions while keeping this one alive", async () => {
    const reg = await register({ email: "changepw1@test.com", password: "oldpassword" });
    const originalToken = reg.body.data.accessToken;

    const res = await request(app)
      .put("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${originalToken}`)
      .send({ currentPassword: "oldpassword", newPassword: "newpassword456" });

    expect(res.status).toBe(200);
    // A fresh access token is issued so the tab that made the request isn't logged out
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.accessToken).not.toBe(originalToken);

    // The OLD access token must now be rejected (tokenVersion bumped)
    const oldTokenRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${originalToken}`);
    expect(oldTokenRes.status).toBe(401);

    // The NEW access token works
    const newTokenRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${res.body.data.accessToken}`);
    expect(newTokenRes.status).toBe(200);

    // Can log in with the new password (login is authLimiter-guarded, used once here)
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: "changepw1@test.com", password: "newpassword456" });
    expect(loginRes.status).toBe(200);
  });

  it("rejects an incorrect current password", async () => {
    const reg = await register({ email: "changepw2@test.com", password: "oldpassword" });
    const res = await request(app)
      .put("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.data.accessToken}`)
      .send({ currentPassword: "wrongcurrent", newPassword: "newpassword456" });
    expect(res.status).toBe(401);
  });
});
