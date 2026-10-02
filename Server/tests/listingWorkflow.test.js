import { describe, it, expect } from "vitest";
import request from "supertest";
import PetListing from "../src/models/PetListing.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Listing Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

const VALID_LISTING = {
  title: "A Friendly Dog",
  petType: "dog",
  breed: "Labrador",
  age: 3,
  gender: "male",
  price: 0,
  location: "Colombo",
  description: "Loves walks",
  healthInfo: "Vaccinated",
  contactDetails: "owner@example.com",
  listingType: "adoption",
};

describe("POST /api/v1/listings", () => {
  it("creates a listing in pending status, awaiting moderation", async () => {
    const { token } = await registerAndLogin("createlisting1@test.com");
    const res = await request(app).post("/api/v1/listings").set("Authorization", `Bearer ${token}`).send(VALID_LISTING);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.title).toBe("A Friendly Dog");
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/v1/listings").send(VALID_LISTING);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/listings — filtering", () => {
  it("only returns active listings", async () => {
    const { userId } = await registerAndLogin("listfilter1@test.com");
    await PetListing.create({ ...VALID_LISTING, title: "Active Dog", owner: userId, status: "active" });
    await PetListing.create({ ...VALID_LISTING, title: "Pending Dog", owner: userId, status: "pending" });

    const res = await request(app).get("/api/v1/listings");
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.title !== "Pending Dog")).toBe(true);
  });

  it("filters by petType", async () => {
    const { userId } = await registerAndLogin("listfilter2@test.com");
    await PetListing.create({ ...VALID_LISTING, petType: "cat", title: "A Cat", owner: userId, status: "active" });
    await PetListing.create({ ...VALID_LISTING, petType: "dog", title: "A Dog", owner: userId, status: "active" });

    const res = await request(app).get("/api/v1/listings?petType=cat");
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.petType === "cat")).toBe(true);
  });

  it("filters by search text across title/breed/description", async () => {
    const { userId } = await registerAndLogin("listfilter3@test.com");
    await PetListing.create({ ...VALID_LISTING, title: "Unique Searchable Name", owner: userId, status: "active" });
    await PetListing.create({ ...VALID_LISTING, title: "Something Else", owner: userId, status: "active" });

    const res = await request(app).get("/api/v1/listings?search=Searchable");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("filters by price range", async () => {
    const { userId } = await registerAndLogin("listfilter4@test.com");
    await PetListing.create({ ...VALID_LISTING, title: "Cheap", price: 1000, owner: userId, status: "active" });
    await PetListing.create({ ...VALID_LISTING, title: "Expensive", price: 100000, owner: userId, status: "active" });

    const res = await request(app).get("/api/v1/listings?minPrice=500&maxPrice=5000");
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.price >= 500 && l.price <= 5000)).toBe(true);
  });
});

describe("DELETE /api/v1/listings/:id", () => {
  it("soft-deletes (status: removed) rather than removing the document", async () => {
    const { userId, token } = await registerAndLogin("deletelist1@test.com");
    const listing = await PetListing.create({ ...VALID_LISTING, owner: userId, status: "active" });

    const res = await request(app).delete(`/api/v1/listings/${listing._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const stillExists = await PetListing.findById(listing._id);
    expect(stillExists.status).toBe("removed");
  });

  it("forbids a non-owner from deleting", async () => {
    const owner = await registerAndLogin("deletelist2@test.com");
    const intruder = await registerAndLogin("deletelist3@test.com");
    const listing = await PetListing.create({ ...VALID_LISTING, owner: owner.userId, status: "active" });

    const res = await request(app).delete(`/api/v1/listings/${listing._id}`).set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/v1/listings/:id/status", () => {
  it("lets the owner mark a listing sold", async () => {
    const { userId, token } = await registerAndLogin("statuslist1@test.com");
    const listing = await PetListing.create({ ...VALID_LISTING, owner: userId, status: "active" });

    const res = await request(app).put(`/api/v1/listings/${listing._id}/status`).set("Authorization", `Bearer ${token}`).send({ status: "sold" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("sold");
  });

  it("rejects an invalid status value", async () => {
    const { userId, token } = await registerAndLogin("statuslist2@test.com");
    const listing = await PetListing.create({ ...VALID_LISTING, owner: userId, status: "active" });

    const res = await request(app).put(`/api/v1/listings/${listing._id}/status`).set("Authorization", `Bearer ${token}`).send({ status: "banana" });
    expect(res.status).toBe(400);
  });

  it("forbids a non-owner from changing status", async () => {
    const owner = await registerAndLogin("statuslist3@test.com");
    const intruder = await registerAndLogin("statuslist4@test.com");
    const listing = await PetListing.create({ ...VALID_LISTING, owner: owner.userId, status: "active" });

    const res = await request(app).put(`/api/v1/listings/${listing._id}/status`).set("Authorization", `Bearer ${intruder.token}`).send({ status: "sold" });
    expect(res.status).toBe(403);
  });
});
