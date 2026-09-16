import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Shelter from "../src/models/Shelter.js";
import Campaign from "../src/models/Campaign.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Shelter Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

// Role isn't embedded in the JWT — `protect` reads it fresh from the DB on
// every request — so promoting a normal user to admin after login is enough
// for their existing token to start working on admin-only routes.
async function registerAdmin(email) {
  const { userId, token } = await registerAndLogin(email);
  await User.findByIdAndUpdate(userId, { role: "admin" });
  return { userId, token };
}

const makeShelter = (overrides = {}) =>
  Shelter.create({
    name: "Test Shelter",
    type: "shelter",
    description: "A place for pets",
    location: { city: "Colombo", country: "Sri Lanka" },
    isActive: true,
    ...overrides,
  });

describe("Shelter admin routes — authorization", () => {
  it("rejects a non-admin user creating a shelter", async () => {
    const { token } = await registerAndLogin("shelterregular@test.com");

    const res = await request(app)
      .post("/api/v1/shelters/admin")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Shelter", type: "shelter", description: "desc", city: "Colombo", country: "Sri Lanka" });

    expect(res.status).toBe(403);
  });

  it("rejects a non-admin user deleting a shelter", async () => {
    const { token } = await registerAndLogin("shelterregular2@test.com");
    const shelter = await makeShelter();

    const res = await request(app)
      .delete(`/api/v1/shelters/admin/${shelter._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("allows an admin to create a shelter", async () => {
    const { token } = await registerAdmin("shelteradmin1@test.com");

    const res = await request(app)
      .post("/api/v1/shelters/admin")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Shelter", type: "shelter", description: "desc", city: "Colombo", country: "Sri Lanka" });

    expect(res.status).toBe(201);
  });
});

describe("Shelter delete guard", () => {
  it("blocks deleting a shelter referenced only by a soft-deleted campaign", async () => {
    const { userId, token } = await registerAdmin("shelteradmin2@test.com");
    const shelter = await makeShelter();

    await Campaign.create({
      title: "Old Campaign",
      shortDescription: "short",
      description: "desc",
      goalAmount: 10000,
      category: "medical",
      status: "draft",
      createdBy: userId,
      beneficiary: shelter._id,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      deletedAt: new Date(), // soft-deleted, but the reference still exists
    });

    const res = await request(app)
      .delete(`/api/v1/shelters/admin/${shelter._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/referenced by/i);
  });

  it("allows deleting a shelter with no campaign references at all", async () => {
    const { token } = await registerAdmin("shelteradmin3@test.com");
    const shelter = await makeShelter();

    const res = await request(app)
      .delete(`/api/v1/shelters/admin/${shelter._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe("Shelter text sanitization", () => {
  it("strips HTML tags from name and description on save", async () => {
    const shelter = await makeShelter({
      name: "<b>Bold Shelter</b>",
      description: "<script>alert(1)</script>Safe text",
    });

    expect(shelter.name).toBe("Bold Shelter");
    expect(shelter.description).toBe("Safe text");
  });
});
