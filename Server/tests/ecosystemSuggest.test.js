import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

// Fish requires: tank, filter, heater. Optional: thermometer, lighting, etc.
async function seedFishProducts() {
  const tank = await Product.create({
    name: "Basic Tank", description: "d", category: "habitat", price: 2000, stock: 5,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"], tags: ["tank"], averageRating: 4.5, reviewCount: 10,
  });
  const filter = await Product.create({
    name: "Basic Filter", description: "d", category: "habitat", price: 1500, stock: 5,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"], tags: ["filter"], averageRating: 4.2, reviewCount: 8,
  });
  const heater = await Product.create({
    name: "Basic Heater", description: "d", category: "habitat", price: 1000, stock: 5,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"], tags: ["heater"], averageRating: 4.0, reviewCount: 5,
  });
  const thermometer = await Product.create({
    name: "Basic Thermometer", description: "d", category: "accessories", price: 500, stock: 5,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"], tags: ["thermometer"], averageRating: 4.0, reviewCount: 3,
  });
  return { tank, filter, heater, thermometer };
}

describe("POST /api/v1/ecosystem/suggest", () => {
  it("rejects an unsupported pet type", async () => {
    const res = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "dragon", budget: 5000 });
    expect(res.status).toBe(400);
  });

  it("rejects a missing or non-positive budget", async () => {
    const res1 = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish" });
    expect(res1.status).toBe(400);

    const res2 = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish", budget: -100 });
    expect(res2.status).toBe(400);
  });

  it("fills every required category and adds optional ones within a generous budget", async () => {
    const { tank, filter, heater, thermometer } = await seedFishProducts();

    const res = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish", budget: 20000 });

    expect(res.status).toBe(200);
    const categoryKeys = res.body.data.selections.map((s) => s.categoryKey);
    expect(categoryKeys).toEqual(expect.arrayContaining(["tank", "filter", "heater", "thermometer"]));

    const productIds = res.body.data.selections.map((s) => s.productId);
    expect(productIds).toEqual(expect.arrayContaining([
      String(tank._id), String(filter._id), String(heater._id), String(thermometer._id),
    ]));

    expect(res.body.data.overBudget).toBe(false);
    expect(res.body.data.totalPrice).toBe(2000 + 1500 + 1000 + 500);
    expect(res.body.data.notes).toHaveLength(0);
  });

  it("still fills required categories on a too-tight budget, and flags it honestly", async () => {
    await seedFishProducts();
    // Required total is 2000+1500+1000 = 4500; give it far less.
    const res = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish", budget: 1000 });

    expect(res.status).toBe(200);
    const categoryKeys = res.body.data.selections.map((s) => s.categoryKey);
    // All three required categories present even though it blows the budget.
    expect(categoryKeys).toEqual(expect.arrayContaining(["tank", "filter", "heater"]));
    // No optional category should have been added — nothing affordable.
    expect(categoryKeys).not.toContain("thermometer");

    expect(res.body.data.overBudget).toBe(true);
    expect(res.body.data.totalPrice).toBe(4500);
    expect(res.body.data.notes.length).toBeGreaterThan(0);
  });

  it("never invents a product — an empty catalog yields no selections plus explanatory notes", async () => {
    const res = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish", budget: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.data.selections).toHaveLength(0);
    expect(res.body.data.totalPrice).toBe(0);
    // One note per missing required category (tank, filter, heater)
    expect(res.body.data.notes.length).toBe(3);
  });

  it("ignores out-of-stock and inactive products", async () => {
    await Product.create({
      name: "Out of stock tank", description: "d", category: "habitat", price: 500, stock: 0,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      compatiblePets: ["fish"], tags: ["tank"], averageRating: 5, reviewCount: 50,
    });
    await Product.create({
      name: "Inactive tank", description: "d", category: "habitat", price: 500, stock: 5, isActive: false,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      compatiblePets: ["fish"], tags: ["tank"], averageRating: 5, reviewCount: 50,
    });
    const goodTank = await Product.create({
      name: "Good tank", description: "d", category: "habitat", price: 2000, stock: 5,
      images: [{ url: "http://example.com/a.png", publicId: "a" }],
      compatiblePets: ["fish"], tags: ["tank"], averageRating: 3, reviewCount: 2,
    });

    const res = await request(app).post("/api/v1/ecosystem/suggest").send({ petType: "fish", budget: 20000 });

    const tankSelection = res.body.data.selections.find((s) => s.categoryKey === "tank");
    expect(tankSelection.productId).toBe(String(goodTank._id));
  });
});
