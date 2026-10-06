import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";

const { default: app } = await import("../app.js");

const VALID_USER = {
  name: "Auth Test User",
  email: "authuser@test.com",
  password: "password123",
  phone: "1234567890",
  location: "Test City",
};

const register = (overrides = {}) =>
  request(app).post("/api/v1/auth/register").send({ ...VALID_USER, ...overrides });

// register/login/refresh/forgot/reset all share one IP-keyed rate limiter
// (15 requests / 15 min) within a single app instance — this file's calls
// must stay well under that budget. Other auth flows live in separate test
// files for the same reason (fresh limiter state per file).
describe("POST /api/v1/auth/register", () => {
  it("creates a new account and returns an access token + user (no password)", async () => {
    const res = await register({ email: "newreg@test.com" });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe("newreg@test.com");
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.role).toBe("user");
  });

  it("accepts valid modern top-level domains", async () => {
    const res = await register({ email: "keeper@wildlife.museum" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("keeper@wildlife.museum");
  });

  it("rejects a duplicate email", async () => {
    await register({ email: "dupe@test.com" });
    const res = await register({ email: "dupe@test.com" });
    expect(res.status).toBe(409);
  });

  it("rejects non-string field values with a 400", async () => {
    const res = await register({ email: { $gt: "" }, password: "password123" });
    expect(res.status).toBe(400);
  });

  it("ignores a client-supplied role — mass assignment is not possible", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID_USER, email: "massassign@test.com", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("user");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await register({ email: "login1@test.com", password: "correctpass" });
    const res = await request(app).post("/api/v1/auth/login").send({ email: "login1@test.com", password: "correctpass" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("rejects an incorrect password without revealing whether the email exists", async () => {
    await register({ email: "login2@test.com", password: "correctpass" });
    const res = await request(app).post("/api/v1/auth/login").send({ email: "login2@test.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("rejects login for a nonexistent email with the same generic message", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "doesnotexist@test.com", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  // Regression: {"$ne": null} is sanitized to {} (truthy), which used to reach
  // Mongoose, throw a CastError, and come back as a misleading 404.
  it("answers operator-object credentials with a clean 400, not a 404 or a login", async () => {
    await register({ email: "injection@test.com", password: "correctpass" });
    const res = await request(app).post("/api/v1/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.data?.accessToken).toBeUndefined();
  });

  it("rejects a blocked user", async () => {
    const reg = await register({ email: "blocked@test.com", password: "correctpass" });
    await User.findByIdAndUpdate(reg.body.data.user._id, { isBlocked: true });
    const res = await request(app).post("/api/v1/auth/login").send({ email: "blocked@test.com", password: "correctpass" });
    expect(res.status).toBe(403);
  });
});
