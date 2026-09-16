import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import PetListing from "../src/models/PetListing.js";
import Favorite from "../src/models/Favorite.js";
import User from "../src/models/User.js";
import { generateAccessToken } from "../src/utils/generateToken.js";

// Regression coverage for the My Listings dashboard: the enquiry counter
// (revealListingContact by a non-owner), the live-computed saves count
// (never a duplicated field on the listing itself), and the pause/resume
// toggle that hides a listing from the public marketplace without losing
// its place in the moderation queue.
describe("My Listings — enquiries, saves, pause/resume", () => {
  const makeOwnerAndListing = async (overrides = {}) => {
    const owner = await User.create({
      name: "Owner",
      email: `owner_${Date.now()}_${Math.random()}@test.com`,
      password: "password123",
      phone: "0771234567",
      location: "Colombo",
    });
    const listing = await PetListing.create({
      title: "Friendly Dog",
      petType: "dog",
      breed: "Labrador",
      age: 12,
      gender: "male",
      price: 0,
      location: "Colombo",
      description: "A friendly dog",
      healthInfo: "Healthy",
      listingType: "adoption",
      contactDetails: "0711112222",
      owner: owner._id,
      status: "active",
      ...overrides,
    });
    return { owner, listing };
  };

  it("increments enquiriesCount when a non-owner reveals contact, not when the owner does", async () => {
    const { owner, listing } = await makeOwnerAndListing();
    const buyer = await User.create({
      name: "Buyer",
      email: `buyer_${Date.now()}@test.com`,
      password: "password123",
      phone: "0779998888",
      location: "Kandy",
    });
    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);
    const buyerToken = generateAccessToken(buyer._id, buyer.tokenVersion);

    await request(app).post(`/api/v1/listings/${listing._id}/reveal-contact`).set("Authorization", `Bearer ${ownerToken}`);
    let updated = await PetListing.findById(listing._id);
    expect(updated.enquiriesCount).toBe(0);

    await request(app).post(`/api/v1/listings/${listing._id}/reveal-contact`).set("Authorization", `Bearer ${buyerToken}`);
    updated = await PetListing.findById(listing._id);
    expect(updated.enquiriesCount).toBe(1);
  });

  it("computes savesCount live from Favorite documents in getMyListings", async () => {
    const { owner, listing } = await makeOwnerAndListing();
    const fan1 = await User.create({ name: "Fan1", email: `fan1_${Date.now()}@test.com`, password: "password123", phone: "0771112223", location: "Galle" });
    const fan2 = await User.create({ name: "Fan2", email: `fan2_${Date.now()}@test.com`, password: "password123", phone: "0771112224", location: "Galle" });
    await Favorite.create({ userId: fan1._id, itemType: "listing", itemId: listing._id });
    await Favorite.create({ userId: fan2._id, itemType: "listing", itemId: listing._id });

    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);
    const res = await request(app).get("/api/v1/listings/my/listings").set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    const found = res.body.data.find((l) => l._id === String(listing._id));
    expect(found.savesCount).toBe(2);
  });

  it("toggles a listing between active and paused, owner-only", async () => {
    const { owner, listing } = await makeOwnerAndListing();
    const stranger = await User.create({ name: "Stranger", email: `stranger_${Date.now()}@test.com`, password: "password123", phone: "0771112225", location: "Galle" });
    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);
    const strangerToken = generateAccessToken(stranger._id, stranger.tokenVersion);

    const forbidden = await request(app).put(`/api/v1/listings/${listing._id}/pause`).set("Authorization", `Bearer ${strangerToken}`);
    expect(forbidden.status).toBe(403);

    const paused = await request(app).put(`/api/v1/listings/${listing._id}/pause`).set("Authorization", `Bearer ${ownerToken}`);
    expect(paused.status).toBe(200);
    expect(paused.body.data.status).toBe("paused");

    const resumed = await request(app).put(`/api/v1/listings/${listing._id}/pause`).set("Authorization", `Bearer ${ownerToken}`);
    expect(resumed.status).toBe(200);
    expect(resumed.body.data.status).toBe("active");
  });

  it("rejects pausing a listing that isn't active or paused", async () => {
    const { owner, listing } = await makeOwnerAndListing({ status: "pending" });
    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);

    const res = await request(app).put(`/api/v1/listings/${listing._id}/pause`).set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });

  it("excludes paused listings from the public marketplace", async () => {
    const { listing } = await makeOwnerAndListing({ status: "paused" });

    const res = await request(app).get("/api/v1/listings");
    expect(res.status).toBe(200);
    expect(res.body.data.find((l) => l._id === String(listing._id))).toBeUndefined();
  });

  // Regression: updateListing's allow-list omitted "petType", so editing a
  // listing's species silently had no effect even though the edit form has
  // always shown (and let users change) a species selector.
  it("persists a petType change on update", async () => {
    const { owner, listing } = await makeOwnerAndListing({ petType: "dog" });
    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);

    const res = await request(app)
      .put(`/api/v1/listings/${listing._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("petType", "cat");

    expect(res.status).toBe(200);
    expect(res.body.data.petType).toBe("cat");

    const persisted = await PetListing.findById(listing._id);
    expect(persisted.petType).toBe("cat");
  });

  it("persists verifiedFlags on create and clears them on update with an empty sentinel", async () => {
    const owner = await User.create({
      name: "Owner2",
      email: `owner2_${Date.now()}@test.com`,
      password: "password123",
      phone: "0771234567",
      location: "Colombo",
    });
    const ownerToken = generateAccessToken(owner._id, owner.tokenVersion);

    const createRes = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("title", "Verified Pup")
      .field("petType", "dog")
      .field("breed", "Poodle")
      .field("age", "10")
      .field("gender", "female")
      .field("price", "0")
      .field("location", "Colombo")
      .field("description", "A verified pup")
      .field("healthInfo", "Healthy")
      .field("listingType", "adoption")
      .field("contactDetails", "0711112222")
      .field("verifiedFlags", "Vaccinated")
      .field("verifiedFlags", "Microchipped");

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.verifiedFlags.sort()).toEqual(["Microchipped", "Vaccinated"]);

    const listingId = createRes.body.data._id;
    const clearRes = await request(app)
      .put(`/api/v1/listings/${listingId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("verifiedFlags", "");

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.verifiedFlags).toEqual([]);
  });
});
