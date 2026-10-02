import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Favorite Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Favoritable Product",
    description: "desc",
    category: "toys",
    price: 1000,
    stock: 10,
    isActive: true,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["dog"],
    ...overrides,
  });
}

describe("POST /api/v1/favorites", () => {
  it("adds a product to favorites", async () => {
    const { token } = await registerAndLogin("fav1@test.com");
    const product = await makeProduct();
    const res = await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: product._id });
    expect(res.status).toBe(201);
  });

  it("rejects a nonexistent item", async () => {
    const { token } = await registerAndLogin("fav2@test.com");
    const res = await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: "000000000000000000000000" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid itemType", async () => {
    const { token } = await registerAndLogin("fav3@test.com");
    const res = await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "banana", itemId: "000000000000000000000000" });
    expect(res.status).toBe(400);
  });

  it("rejects favoriting the same item twice", async () => {
    const { token } = await registerAndLogin("fav4@test.com");
    const product = await makeProduct();
    await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: product._id });
    const res = await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: product._id });
    expect(res.status).toBe(409);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/v1/favorites").send({ itemType: "product", itemId: "000000000000000000000000" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/favorites", () => {
  it("returns the user's favorites populated with item details, scoped per user", async () => {
    const a = await registerAndLogin("fav5@test.com");
    const b = await registerAndLogin("fav6@test.com");
    const product = await makeProduct();
    await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${a.token}`).send({ itemType: "product", itemId: product._id });

    const aRes = await request(app).get("/api/v1/favorites").set("Authorization", `Bearer ${a.token}`);
    expect(aRes.status).toBe(200);
    expect(aRes.body.data).toHaveLength(1);
    expect(aRes.body.data[0].item.name).toBe("Favoritable Product");

    const bRes = await request(app).get("/api/v1/favorites").set("Authorization", `Bearer ${b.token}`);
    expect(bRes.body.data).toHaveLength(0);
  });
});

describe("DELETE /api/v1/favorites/:itemType/:itemId", () => {
  it("removes a favorite", async () => {
    const { token } = await registerAndLogin("fav7@test.com");
    const product = await makeProduct();
    await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: product._id });

    const res = await request(app).delete(`/api/v1/favorites/product/${product._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const listRes = await request(app).get("/api/v1/favorites").set("Authorization", `Bearer ${token}`);
    expect(listRes.body.data).toHaveLength(0);
  });

  it("is idempotent — removing something not favorited still returns 200", async () => {
    const { token } = await registerAndLogin("fav8@test.com");
    const res = await request(app).delete("/api/v1/favorites/product/000000000000000000000000").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/favorites/check", () => {
  it("reports which of a batch of items are favorited", async () => {
    const { token } = await registerAndLogin("fav9@test.com");
    const favorited = await makeProduct({ name: "Favorited" });
    const notFavorited = await makeProduct({ name: "Not favorited" });
    await request(app).post("/api/v1/favorites").set("Authorization", `Bearer ${token}`).send({ itemType: "product", itemId: favorited._id });

    const items = JSON.stringify([
      { itemType: "product", itemId: favorited._id.toString() },
      { itemType: "product", itemId: notFavorited._id.toString() },
    ]);
    const res = await request(app).get(`/api/v1/favorites/check?items=${encodeURIComponent(items)}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[favorited._id.toString()]).toBe(true);
    expect(res.body.data[notFavorited._id.toString()]).toBeFalsy();
  });
});
