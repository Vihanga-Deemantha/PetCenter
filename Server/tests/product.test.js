import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../src/models/User.js";
import Product from "../src/models/Products.js";

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
    name: "Product Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Test Product",
    description: "desc",
    category: "toys",
    price: 1999,
    stock: 10,
    isActive: true,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["dog"],
    tags: [],
    ...overrides,
  });
}

describe("GET /api/v1/products", () => {
  it("only returns active products", async () => {
    await makeProduct({ name: "Active One", isActive: true });
    await makeProduct({ name: "Inactive One", isActive: false });

    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.name !== "Inactive One")).toBe(true);
  });

  it("filters by category", async () => {
    await makeProduct({ name: "Food Item", category: "food" });
    await makeProduct({ name: "Toy Item", category: "toys" });

    const res = await request(app).get("/api/v1/products?category=food");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.category === "food")).toBe(true);
  });

  it("filters by compatiblePets", async () => {
    await makeProduct({ name: "Cat Thing", compatiblePets: ["cat"] });
    await makeProduct({ name: "Dog Thing", compatiblePets: ["dog"] });

    const res = await request(app).get("/api/v1/products?compatiblePets=cat");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.compatiblePets.includes("cat"))).toBe(true);
  });

  it("filters by price range", async () => {
    await makeProduct({ name: "Cheap", price: 500 });
    await makeProduct({ name: "Expensive", price: 5000 });

    const res = await request(app).get("/api/v1/products?minPrice=1000&maxPrice=10000");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.price >= 1000 && p.price <= 10000)).toBe(true);
  });

  it("filters to only in-stock items", async () => {
    await makeProduct({ name: "InStock", stock: 5 });
    await makeProduct({ name: "OutOfStock", stock: 0 });

    const res = await request(app).get("/api/v1/products?inStock=true");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.stock > 0)).toBe(true);
  });

  it("clamps an absurd limit instead of returning everything unbounded", async () => {
    const res = await request(app).get("/api/v1/products?limit=999999");
    expect(res.status).toBe(200);
    expect(res.body.pagination.itemsPerPage).toBeLessThanOrEqual(60);
  });
});

describe("GET /api/v1/products/:id", () => {
  it("returns the product with related products from the same category", async () => {
    const product = await makeProduct({ name: "Main", category: "toys" });
    await makeProduct({ name: "Related", category: "toys" });

    const res = await request(app).get(`/api/v1/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Main");
    expect(res.body.data.relatedProducts.length).toBeGreaterThan(0);
  });

  it("404s for an inactive product", async () => {
    const product = await makeProduct({ isActive: false });
    const res = await request(app).get(`/api/v1/products/${product._id}`);
    expect(res.status).toBe(404);
  });

  it("404s for a nonexistent product", async () => {
    const res = await request(app).get("/api/v1/products/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/products/categories", () => {
  it("returns a count per category", async () => {
    await makeProduct({ category: "food" });
    await makeProduct({ category: "food" });
    const res = await request(app).get("/api/v1/products/categories");
    expect(res.status).toBe(200);
    const food = res.body.data.find((c) => c.name === "food");
    expect(food.count).toBeGreaterThanOrEqual(2);
  });
});

describe("POST /api/v1/products — admin only", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadminproduct@test.com");
    const res = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${token}`).send({ name: "x" });
    expect(res.status).toBe(403);
  });

  it("rejects a non-integer price even for an admin", async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "x", description: "d", category: "toys", price: "19.99", stock: 5, compatiblePets: ["dog"] });
    expect(res.status).toBe(400);
  });

  it("rejects creating a product with no images", async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "x", description: "d", category: "toys", price: 1999, stock: 5, compatiblePets: ["dog"] });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/v1/products/:id — admin only", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadminupdate@test.com");
    const product = await makeProduct();
    const res = await request(app).put(`/api/v1/products/${product._id}`).set("Authorization", `Bearer ${token}`).send({ name: "Hacked" });
    expect(res.status).toBe(403);
  });

  it("updates allowed fields", async () => {
    const admin = await makeAdmin();
    const product = await makeProduct();
    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Updated Name", price: 2999 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Name");
    expect(res.body.data.price).toBe(2999);
  });

  it("rejects an update that would leave zero images", async () => {
    const admin = await makeAdmin();
    const product = await makeProduct({ images: [{ url: "https://example.com/only.png", publicId: "only" }] });
    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ removeImageIds: ["only"] });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/products/:id/stock — admin only", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadminstock@test.com");
    const product = await makeProduct();
    const res = await request(app).patch(`/api/v1/products/${product._id}/stock`).set("Authorization", `Bearer ${token}`).send({ stock: 50 });
    expect(res.status).toBe(403);
  });

  it("updates stock for an admin", async () => {
    const admin = await makeAdmin();
    const product = await makeProduct({ stock: 5 });
    const res = await request(app).patch(`/api/v1/products/${product._id}/stock`).set("Authorization", `Bearer ${admin.token}`).send({ stock: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(50);
  });

  it("rejects a negative stock value", async () => {
    const admin = await makeAdmin();
    const product = await makeProduct();
    const res = await request(app).patch(`/api/v1/products/${product._id}/stock`).set("Authorization", `Bearer ${admin.token}`).send({ stock: -5 });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/products/:id — admin only, soft delete", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("notadmindelete@test.com");
    const product = await makeProduct();
    const res = await request(app).delete(`/api/v1/products/${product._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("soft-deletes (isActive: false) rather than removing the document", async () => {
    const admin = await makeAdmin();
    const product = await makeProduct();
    const res = await request(app).delete(`/api/v1/products/${product._id}`).set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);

    const stillExists = await Product.findById(product._id);
    expect(stillExists).toBeTruthy();
    expect(stillExists.isActive).toBe(false);

    // And it disappears from the public catalog
    const publicRes = await request(app).get(`/api/v1/products/${product._id}`);
    expect(publicRes.status).toBe(404);
  });
});
