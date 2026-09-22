import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import PetListing from "../src/models/PetListing.js";

const destroyMock = vi.fn().mockResolvedValue({ result: "ok" });
vi.mock("../src/config/cloudinary.js", () => ({
  default: { uploader: { destroy: (...args) => destroyMock(...args) } },
}));

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Listing Owner",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeListing(ownerId, imagePublicIds) {
  return PetListing.create({
    title: "A Good Dog",
    petType: "dog",
    breed: "Mixed",
    age: 2,
    gender: "male",
    price: 0,
    location: "Colombo",
    description: "desc",
    healthInfo: "Up to date on vaccinations",
    contactDetails: "owner@example.com",
    listingType: "adoption",
    images: imagePublicIds.map((id) => `https://example.com/${id}.jpg`),
    imagePublicIds,
    owner: ownerId,
    status: "active",
  });
}

describe("PUT /api/v1/listings/:id — removeImageIds only destroys this listing's own Cloudinary assets", () => {
  beforeEach(() => destroyMock.mockClear());

  it("never calls cloudinary.uploader.destroy for an ID that isn't one of this listing's own images", async () => {
    const { userId, token } = await registerAndLogin("imgowner1@test.com");
    const listing = await makeListing(userId, ["my-listing-image-1", "my-listing-image-2"]);

    // Public IDs are visible in every image URL on the site — this simulates
    // an attacker who read someone else's (or the store's) publicId and
    // tries to have it destroyed via their own, unrelated listing update.
    const res = await request(app)
      .put(`/api/v1/listings/${listing._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ removeImageIds: ["someone-elses-product-image"] });

    expect(res.status).toBe(200);
    expect(destroyMock).not.toHaveBeenCalled();

    // And this listing's own images must be untouched.
    const reloaded = await PetListing.findById(listing._id);
    expect(reloaded.imagePublicIds).toEqual(["my-listing-image-1", "my-listing-image-2"]);
  });

  it("still destroys an ID that genuinely belongs to this listing", async () => {
    const { userId, token } = await registerAndLogin("imgowner2@test.com");
    const listing = await makeListing(userId, ["my-listing-image-1", "my-listing-image-2"]);

    const res = await request(app)
      .put(`/api/v1/listings/${listing._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ removeImageIds: ["my-listing-image-1"] });

    expect(res.status).toBe(200);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledWith("my-listing-image-1");

    const reloaded = await PetListing.findById(listing._id);
    expect(reloaded.imagePublicIds).toEqual(["my-listing-image-2"]);
  });

  it("only destroys the subset of a mixed batch that actually belongs to this listing", async () => {
    const { userId, token } = await registerAndLogin("imgowner3@test.com");
    const listing = await makeListing(userId, ["my-listing-image-1", "my-listing-image-2"]);

    const res = await request(app)
      .put(`/api/v1/listings/${listing._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ removeImageIds: ["my-listing-image-1", "not-mine-at-all"] });

    expect(res.status).toBe(200);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledWith("my-listing-image-1");
  });
});
