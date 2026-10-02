import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import PetListing from "../src/models/PetListing.js";
import EcosystemBuild from "../src/models/EcosystemBuild.js";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email, overrides = {}) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Admin Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    ...overrides,
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

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

async function makeListing(ownerId, overrides = {}) {
  return PetListing.create({
    title: "A Good Dog",
    petType: "dog",
    breed: "Mixed",
    age: 2,
    gender: "male",
    price: 0,
    location: "Colombo",
    description: "desc",
    healthInfo: "Vaccinated",
    contactDetails: "owner@example.com",
    listingType: "adoption",
    images: [],
    imagePublicIds: [],
    owner: ownerId,
    status: "pending",
    ...overrides,
  });
}

describe("Admin routes — non-admin is forbidden", () => {
  it("rejects a regular user from the dashboard and user list", async () => {
    const { token } = await registerAndLogin("regularadmin1@test.com");
    const dashRes = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${token}`);
    expect(dashRes.status).toBe(403);

    const usersRes = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${token}`);
    expect(usersRes.status).toBe(403);
  });

  it("rejects an unauthenticated request entirely", async () => {
    const res = await request(app).get("/api/v1/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/admin/users", () => {
  it("lists users and supports a name/email search", async () => {
    const admin = await makeAdmin();
    await registerAndLogin("findme_zelda@test.com", { name: "Zelda Findme" });
    await registerAndLogin("someoneelse@test.com", { name: "Someone Else" });

    const res = await request(app).get("/api/v1/admin/users?search=findme").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe("findme_zelda@test.com");
  });

  it("never includes admins in the list", async () => {
    const admin = await makeAdmin();
    const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${admin.token}`);
    expect(res.body.data.every((u) => u.role !== "admin")).toBe(true);
  });
});

describe("PUT /api/v1/admin/users/:id/block + /unblock", () => {
  it("blocks a user, invalidating their session, then unblocks them", async () => {
    const admin = await makeAdmin();
    const target = await registerAndLogin("blockme@test.com");

    const blockRes = await request(app).put(`/api/v1/admin/users/${target.userId}/block`).set("Authorization", `Bearer ${admin.token}`);
    expect(blockRes.status).toBe(200);

    // Blocked user can no longer use their existing token
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.token}`);
    expect(meRes.status).toBe(403);

    const unblockRes = await request(app).put(`/api/v1/admin/users/${target.userId}/unblock`).set("Authorization", `Bearer ${admin.token}`);
    expect(unblockRes.status).toBe(200);

    const meAgainRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.token}`);
    expect(meAgainRes.status).toBe(200);
  });

  it("refuses to block an admin", async () => {
    const admin1 = await makeAdmin();
    const admin2 = await makeAdmin();
    const res = await request(app).put(`/api/v1/admin/users/${admin2.userId}/block`).set("Authorization", `Bearer ${admin1.token}`);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/admin/users/:id", () => {
  it("soft-deletes a user, invalidates their token, and removes their listings", async () => {
    const admin = await makeAdmin();
    const target = await registerAndLogin("deleteme@test.com");
    await makeListing(target.userId, { status: "active" });

    const res = await request(app).delete(`/api/v1/admin/users/${target.userId}`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);

    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.token}`);
    expect(meRes.status).toBe(401);

    const listings = await PetListing.find({ owner: target.userId });
    expect(listings.every((l) => l.status === "removed")).toBe(true);
  });

  it("refuses to delete an admin", async () => {
    const admin1 = await makeAdmin();
    const admin2 = await makeAdmin();
    const res = await request(app).delete(`/api/v1/admin/users/${admin2.userId}`).set("Authorization", `Bearer ${admin1.token}`);
    expect(res.status).toBe(400);
  });
});

describe("Admin listing moderation", () => {
  it("approves a pending listing, making it active", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("listingowner1@test.com");
    const listing = await makeListing(owner.userId);

    const res = await request(app).put(`/api/v1/admin/listings/${listing._id}/approve`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("active");
  });

  it("rejects approving a listing that isn't pending", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("listingowner2@test.com");
    const listing = await makeListing(owner.userId, { status: "active" });

    const res = await request(app).put(`/api/v1/admin/listings/${listing._id}/approve`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(400);
  });

  it("rejects a pending listing with a moderation note", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("listingowner3@test.com");
    const listing = await makeListing(owner.userId);

    const res = await request(app)
      .put(`/api/v1/admin/listings/${listing._id}/reject`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ note: "Blurry photos" });

    expect(res.status).toBe(200);
    const updated = await PetListing.findById(listing._id);
    expect(updated.status).toBe("removed");
    expect(updated.moderationNote).toBe("Blurry photos");
  });

  it("force-removes an already-active listing", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("listingowner4@test.com");
    const listing = await makeListing(owner.userId, { status: "active" });

    const res = await request(app)
      .put(`/api/v1/admin/listings/${listing._id}/remove`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ note: "Guideline violation" });

    expect(res.status).toBe(200);
    const updated = await PetListing.findById(listing._id);
    expect(updated.status).toBe("removed");
  });

  it("filters the admin listing list by status", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("listingowner5@test.com");
    await makeListing(owner.userId, { status: "pending" });
    await makeListing(owner.userId, { status: "active" });

    const res = await request(app).get("/api/v1/admin/listings?status=pending").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.status === "pending")).toBe(true);
  });
});

describe("Admin ecosystem build moderation", () => {
  it("lists only published builds and can force-unpublish one", async () => {
    const admin = await makeAdmin();
    const owner = await registerAndLogin("buildowner1@test.com");
    const tank = await Product.create({
      name: "Tank", description: "d", category: "habitat", price: 5000, stock: 5, isActive: true,
      images: [{ url: "http://example.com/a.png", publicId: "a" }], compatiblePets: ["fish"], tags: ["tank"],
    });
    const filter = await Product.create({
      name: "Filter", description: "d", category: "habitat", price: 2000, stock: 5, isActive: true,
      images: [{ url: "http://example.com/a.png", publicId: "a" }], compatiblePets: ["fish"], tags: ["filter"],
    });
    const heater = await Product.create({
      name: "Heater", description: "d", category: "habitat", price: 2500, stock: 5, isActive: true,
      images: [{ url: "http://example.com/a.png", publicId: "a" }], compatiblePets: ["fish"], tags: ["heater"],
    });

    const createRes = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        name: "Full Tank",
        petType: "fish",
        selections: [
          { productId: tank._id, categoryKey: "tank" },
          { productId: filter._id, categoryKey: "filter" },
          { productId: heater._id, categoryKey: "heater" },
        ],
      });
    await request(app).patch(`/api/v1/ecosystem/builds/${createRes.body.data._id}/publish`).set("Authorization", `Bearer ${owner.token}`);

    const listRes = await request(app).get("/api/v1/admin/ecosystem/builds").set("Authorization", `Bearer ${admin.token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((b) => b._id === createRes.body.data._id)).toBe(true);

    const unpublishRes = await request(app)
      .patch(`/api/v1/admin/ecosystem/builds/${createRes.body.data._id}/unpublish`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(unpublishRes.status).toBe(200);

    const build = await EcosystemBuild.findById(createRes.body.data._id);
    expect(build.isPublished).toBe(false);
  });
});

describe("GET /api/v1/admin/dashboard", () => {
  it("returns stats to an admin", async () => {
    const admin = await makeAdmin();
    const res = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });
});
