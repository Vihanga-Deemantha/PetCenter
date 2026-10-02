import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Shelter from "../src/models/Shelter.js";
import Campaign from "../src/models/Campaign.js";

const { default: app } = await import("../app.js");

async function makeAdmin() {
  const user = await User.create({
    name: "Admin",
    email: `admin_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    role: "admin",
  });
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "password123" });
  return { userId: user._id, token: res.body.data.accessToken };
}

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

async function makeShelter(overrides = {}) {
  return Shelter.create({
    name: "Happy Paws Shelter",
    type: "shelter",
    description: "desc",
    location: { city: "Colombo", country: "Sri Lanka" },
    contact: { phone: "+94711234567", email: "shelter@example.com" },
    isActive: true,
    ...overrides,
  });
}

describe("GET /api/v1/shelters", () => {
  it("only lists active shelters and omits phone/email", async () => {
    await makeShelter({ name: "Active Shelter", isActive: true });
    await makeShelter({ name: "Inactive Shelter", isActive: false });

    const res = await request(app).get("/api/v1/shelters");
    expect(res.status).toBe(200);
    expect(res.body.data.every((s) => s.name !== "Inactive Shelter")).toBe(true);
    expect(res.body.data[0].contact.phone).toBeUndefined();
    expect(res.body.data[0].contact.email).toBeUndefined();
  });
});

describe("GET /api/v1/shelters/:id", () => {
  it("returns the shelter with its active campaigns, no contact info", async () => {
    const shelter = await makeShelter();
    const admin = await makeAdmin();
    await Campaign.create({
      title: "Active Campaign",
      shortDescription: "short",
      description: "desc",
      goalAmount: 10000,
      category: "medical",
      status: "active",
      beneficiary: shelter._id,
      createdBy: admin.userId,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
    });

    const res = await request(app).get(`/api/v1/shelters/${shelter._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.campaigns).toHaveLength(1);
    expect(res.body.data.contact.phone).toBeUndefined();
  });

  it("404s for an inactive shelter", async () => {
    const shelter = await makeShelter({ isActive: false });
    const res = await request(app).get(`/api/v1/shelters/${shelter._id}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/shelters/:id/reveal-contact", () => {
  it("requires authentication", async () => {
    const shelter = await makeShelter();
    const res = await request(app).post(`/api/v1/shelters/${shelter._id}/reveal-contact`);
    expect(res.status).toBe(401);
  });

  it("reveals phone and email once authenticated", async () => {
    const shelter = await makeShelter();
    const { token } = await registerAndLogin("shelterreveal@test.com");
    const res = await request(app).post(`/api/v1/shelters/${shelter._id}/reveal-contact`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("+94711234567");
    expect(res.body.data.email).toBe("shelter@example.com");
  });
});

describe("Admin shelter CRUD", () => {
  it("creates a shelter with nested location/contact built from flat fields", async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .post("/api/v1/shelters/admin")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "New Shelter", type: "rescue", description: "d", city: "Kandy", country: "Sri Lanka", phone: "+94700000000", email: "new@shelter.com", needsList: "blankets, food" });

    expect(res.status).toBe(201);
    expect(res.body.data.location.city).toBe("Kandy");
    expect(res.body.data.contact.phone).toBe("+94700000000");
    expect(res.body.data.needsList).toEqual(["blankets", "food"]);
  });

  it("updates a shelter", async () => {
    const admin = await makeAdmin();
    const shelter = await makeShelter();
    const res = await request(app)
      .put(`/api/v1/shelters/admin/${shelter._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Renamed Shelter" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed Shelter");
  });

  it("rejects a non-admin from the admin shelter list", async () => {
    const { token } = await registerAndLogin("notadminshelter@test.com");
    const res = await request(app).get("/api/v1/shelters/admin/all").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
