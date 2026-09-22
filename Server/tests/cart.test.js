import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";

const { default: app } = await import("../app.js");

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Cart Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return res.body.data.accessToken;
}

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Chew Toy",
    description: "desc",
    category: "toys",
    price: 999,
    stock: 5,
    isActive: true,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["dog"],
    ...overrides,
  });
}

describe("POST /api/v1/cart/items — add to cart", () => {
  it("adds a new item and snapshots its current price", async () => {
    const token = await registerAndLogin("cartadd1@test.com");
    const product = await makeProduct();

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.items[0].priceAtAdd).toBe(999);
  });

  it("increments quantity when the same product is added again", async () => {
    const token = await registerAndLogin("cartadd2@test.com");
    const product = await makeProduct({ stock: 10 });

    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 2 });
    const res = await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 3 });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(5);
  });

  it("rejects a negative quantity", async () => {
    const token = await registerAndLogin("cartadd3@test.com");
    const product = await makeProduct();

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id, quantity: -1 });

    expect(res.status).toBe(400);
  });

  it("rejects a quantity exceeding available stock", async () => {
    const token = await registerAndLogin("cartadd4@test.com");
    const product = await makeProduct({ stock: 3 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id, quantity: 4 });

    expect(res.status).toBe(400);
  });

  it("rejects an out-of-stock product", async () => {
    const token = await registerAndLogin("cartadd5@test.com");
    const product = await makeProduct({ stock: 0 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id, quantity: 1 });

    expect(res.status).toBe(400);
  });

  it("rejects adding a product that belongs to a different (unauthenticated) request", async () => {
    const product = await makeProduct();
    const res = await request(app).post("/api/v1/cart/items").send({ productId: product._id, quantity: 1 });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/cart/items/:productId — update quantity", () => {
  it("updates the quantity of an existing item", async () => {
    const token = await registerAndLogin("cartupd1@test.com");
    const product = await makeProduct({ stock: 10 });
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 1 });

    const res = await request(app)
      .put(`/api/v1/cart/items/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 4 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(4);
  });

  it("removes the item when quantity is set to 0", async () => {
    const token = await registerAndLogin("cartupd2@test.com");
    const product = await makeProduct();
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 1 });

    const res = await request(app)
      .put(`/api/v1/cart/items/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.itemCount).toBe(0);
  });

  it("rejects a quantity above available stock", async () => {
    const token = await registerAndLogin("cartupd3@test.com");
    const product = await makeProduct({ stock: 3 });
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 1 });

    const res = await request(app)
      .put(`/api/v1/cart/items/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 99 });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/cart/items/:productId — remove item", () => {
  it("removes a single item without touching the rest of the cart", async () => {
    const token = await registerAndLogin("cartrem1@test.com");
    const productA = await makeProduct({ name: "A" });
    const productB = await makeProduct({ name: "B" });
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: productA._id, quantity: 1 });
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: productB._id, quantity: 1 });

    const res = await request(app).delete(`/api/v1/cart/items/${productA._id}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const cartRes = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${token}`);
    expect(cartRes.body.data.items).toHaveLength(1);
    expect(cartRes.body.data.items[0].productId).toBe(String(productB._id));
  });
});

describe("DELETE /api/v1/cart — clear cart", () => {
  it("empties the cart entirely", async () => {
    const token = await registerAndLogin("cartclear1@test.com");
    const product = await makeProduct();
    await request(app).post("/api/v1/cart/items").set("Authorization", `Bearer ${token}`).send({ productId: product._id, quantity: 1 });

    const res = await request(app).delete("/api/v1/cart").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const cartRes = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${token}`);
    expect(cartRes.body.data.items).toHaveLength(0);
  });
});

describe("POST /api/v1/cart/bulk — bulk add (Ecosystem Builder)", () => {
  it("adds every valid item and reports itemCount correctly", async () => {
    const token = await registerAndLogin("cartbulk1@test.com");
    const productA = await makeProduct({ name: "A", stock: 5 });
    const productB = await makeProduct({ name: "B", stock: 5 });

    const res = await request(app)
      .post("/api/v1/cart/bulk")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: productA._id, quantity: 1 }, { productId: productB._id, quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.added).toHaveLength(2);
    expect(res.body.data.failed).toHaveLength(0);
    expect(res.body.data.itemCount).toBe(3);
  });

  it("reports out-of-stock items as failed without failing the whole batch", async () => {
    const token = await registerAndLogin("cartbulk2@test.com");
    const inStock = await makeProduct({ name: "In stock", stock: 5 });
    const outOfStock = await makeProduct({ name: "Out of stock", stock: 0 });

    const res = await request(app)
      .post("/api/v1/cart/bulk")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: inStock._id, quantity: 1 }, { productId: outOfStock._id, quantity: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.added).toHaveLength(1);
    expect(res.body.data.failed).toHaveLength(1);
  });

  // Regression test: a malformed quantity in one batch entry used to throw
  // an unhandled Mongoose ValidationError out of cart.save(), which silently
  // discarded every other, legitimately-added item in the same request.
  it("rejects a negative/non-integer quantity entry without dropping the other valid items in the same batch", async () => {
    const token = await registerAndLogin("cartbulk3@test.com");
    const good = await makeProduct({ name: "Good", stock: 5 });
    const bad = await makeProduct({ name: "Bad", stock: 5 });

    const res = await request(app)
      .post("/api/v1/cart/bulk")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: good._id, quantity: 1 }, { productId: bad._id, quantity: -3 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.added).toHaveLength(1);
    expect(res.body.data.added[0].productId).toBe(String(good._id));
    expect(res.body.data.failed).toHaveLength(1);
    expect(res.body.data.failed[0].productId).toBe(String(bad._id));

    const cartRes = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${token}`);
    expect(cartRes.body.data.items).toHaveLength(1);
  });

  it("rejects an empty items array", async () => {
    const token = await registerAndLogin("cartbulk4@test.com");
    const res = await request(app).post("/api/v1/cart/bulk").set("Authorization", `Bearer ${token}`).send({ items: [] });
    expect(res.status).toBe(400);
  });
});
