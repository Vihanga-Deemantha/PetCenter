import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import PetListing from "../src/models/PetListing.js";
import User from "../src/models/User.js";
import { generateAccessToken } from "../src/utils/generateToken.js";

// Regression test: PetListing.contactDetails must never be returned by the
// public getListing endpoint, and revealListingContact must require auth —
// otherwise the "sign in to reveal contact" UI is cosmetic only.
describe("Listing contact details", () => {
  const makeUserAndListing = async () => {
    const owner = await User.create({
      name: "Seller",
      email: `seller_${Date.now()}@test.com`,
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
    });

    return { owner, listing };
  };

  it("never includes contactDetails in the public listing payload", async () => {
    const { listing } = await makeUserAndListing();

    const res = await request(app).get(`/api/v1/listings/${listing._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("contactDetails");
  });

  it("rejects reveal-contact without auth", async () => {
    const { listing } = await makeUserAndListing();

    const res = await request(app).post(`/api/v1/listings/${listing._id}/reveal-contact`);

    expect(res.status).toBe(401);
  });

  it("returns real contact details to an authenticated user", async () => {
    const { listing } = await makeUserAndListing();
    const buyer = await User.create({
      name: "Buyer",
      email: `buyer_${Date.now()}@test.com`,
      password: "password123",
      phone: "0779998888",
      location: "Kandy",
    });
    const token = generateAccessToken(buyer._id, buyer.tokenVersion);

    const res = await request(app)
      .post(`/api/v1/listings/${listing._id}/reveal-contact`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.contactDetails).toBe("0711112222");
  });
});
