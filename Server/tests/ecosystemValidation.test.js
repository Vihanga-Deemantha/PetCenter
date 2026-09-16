import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Builder Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Fish Tank",
    description: "A tank",
    price: 5000,
    category: "habitat",
    stock: 5,
    isActive: true,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
    compatiblePets: ["fish"],
    tags: ["tank"],
    ...overrides,
  });
}

describe("POST /api/v1/ecosystem/builds — server-side selection validation", () => {
  it("rejects a product that isn't compatible with the build's pet type", async () => {
    const { token } = await registerAndLogin("ecoincompat@test.com");
    const dogLeash = await makeProduct({ name: "Dog Leash", compatiblePets: ["dog"], tags: ["tank"] });

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Fish Tank", petType: "fish", selections: [{ productId: dogLeash._id, categoryKey: "tank" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not compatible/i);
  });

  it("rejects a productId under a categoryKey it isn't tagged for", async () => {
    const { token } = await registerAndLogin("ecowrongcat@test.com");
    const filter = await makeProduct({ name: "Filter", tags: ["filter"] });

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Fish Tank", petType: "fish", selections: [{ productId: filter._id, categoryKey: "tank" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong/i);
  });

  it("rejects an unknown categoryKey for the pet type", async () => {
    const { token } = await registerAndLogin("ecobadkey@test.com");
    const tank = await makeProduct();

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Fish Tank", petType: "fish", selections: [{ productId: tank._id, categoryKey: "not-a-real-category" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not a valid category/i);
  });

  it("rejects exceeding a category's maxSelectable", async () => {
    const { token } = await registerAndLogin("ecomaxsel@test.com");
    // "tank" category for fish has maxSelectable: 1
    const tankA = await makeProduct({ name: "Tank A" });
    const tankB = await makeProduct({ name: "Tank B" });

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "My Fish Tank",
        petType: "fish",
        selections: [
          { productId: tankA._id, categoryKey: "tank" },
          { productId: tankB._id, categoryKey: "tank" },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/allows at most/i);
  });

  it("rejects an inactive (deactivated) product", async () => {
    const { token } = await registerAndLogin("ecoinactive@test.com");
    const tank = await makeProduct({ isActive: false });

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Fish Tank", petType: "fish", selections: [{ productId: tank._id, categoryKey: "tank" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no longer available/i);
  });

  it("accepts a well-formed, compatible selection", async () => {
    const { token } = await registerAndLogin("ecovalid@test.com");
    const tank = await makeProduct();

    const res = await request(app)
      .post("/api/v1/ecosystem/builds")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Fish Tank", petType: "fish", selections: [{ productId: tank._id, categoryKey: "tank" }] });

    expect(res.status).toBe(201);
    expect(res.body.data.selections).toHaveLength(1);
    expect(res.body.data.totalPrice).toBe(5000);
  });
});
