import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import PET_CONFIGS from "../src/config/petConfig.js";
import Product from "../src/models/Products.js";
import PetListing from "../src/models/PetListing.js";
import Shelter from "../src/models/Shelter.js";
import Campaign from "../src/models/Campaign.js";
import {
  DEMO_PRODUCTS,
  DEMO_PETS,
  DEMO_SHELTERS,
  DEMO_CAMPAIGNS,
} from "../src/config/demoSeedData.js";

describe("demo seed catalog", () => {
  it("stays within the requested catalog sizes and uses unique identities", () => {
    expect(DEMO_PRODUCTS.length).toBeGreaterThanOrEqual(30);
    expect(DEMO_PRODUCTS.length).toBeLessThanOrEqual(60);
    expect(DEMO_PETS.length).toBeGreaterThanOrEqual(30);
    expect(DEMO_PETS.length).toBeLessThanOrEqual(50);
    expect(DEMO_SHELTERS).toHaveLength(8);
    expect(DEMO_CAMPAIGNS).toHaveLength(10);
    expect(new Set(DEMO_PRODUCTS.map((item) => item.name)).size).toBe(DEMO_PRODUCTS.length);
    expect(new Set(DEMO_PETS.map((item) => item.title)).size).toBe(DEMO_PETS.length);
  });

  it("provides at least one compatible product for every builder category", () => {
    for (const [petType, config] of Object.entries(PET_CONFIGS)) {
      for (const category of config.categories) {
        const candidates = DEMO_PRODUCTS.filter(
          (item) => item.compatiblePets.includes(petType) && item.tags.includes(category.key),
        );
        expect(candidates.length, `${petType}:${category.key}`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every seeded card relevant, unique images", () => {
    const allUrls = [];

    for (const item of DEMO_PRODUCTS) {
      expect(item.images).toHaveLength(1);
      expect(item.images[0].url).toMatch(/^\/demo-images\/catalog\/product-.+\.webp$/);
      allUrls.push(...item.images.map((image) => image.url));
    }
    for (const item of DEMO_PETS) {
      expect(item.images).toHaveLength(1);
      expect(item.imagePublicIds).toHaveLength(1);
      expect(item.images[0]).toMatch(/^\/demo-images\/catalog\/pet-.+\.webp$/);
      allUrls.push(...item.images);
    }
    for (const item of DEMO_SHELTERS) {
      expect(item.logo.url).toMatch(/^https:\/\//);
      allUrls.push(item.logo.url);
    }
    for (const item of DEMO_CAMPAIGNS) {
      expect(item.images).toHaveLength(3);
      expect(item.images.every((image) => image.url.startsWith("https://"))).toBe(true);
      allUrls.push(...item.images.map((image) => image.url));
    }

    expect(new Set(allUrls).size).toBe(allUrls.length);
  });

  it("passes the real model validation rules", async () => {
    const owner = new mongoose.Types.ObjectId();
    const beneficiary = new mongoose.Types.ObjectId();

    for (const item of DEMO_PRODUCTS) await expect(new Product(item).validate()).resolves.toBeUndefined();
    for (const item of DEMO_PETS) {
      await expect(new PetListing({ ...item, owner, contactDetails: "+94110000103" }).validate()).resolves.toBeUndefined();
    }
    for (const { key: _key, city: _city, ...item } of DEMO_SHELTERS) {
      await expect(new Shelter(item).validate()).resolves.toBeUndefined();
    }
    for (const { key: _key, shelterKey: _shelterKey, contributions: _contributions, ...item } of DEMO_CAMPAIGNS) {
      await expect(new Campaign({ ...item, beneficiary, createdBy: owner }).validate()).resolves.toBeUndefined();
    }
  });
});
