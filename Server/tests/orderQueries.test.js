import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import Product from "../src/models/Products.js";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

const { default: app } = await import("../app.js");

let counter = 0;

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Order Query Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

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

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Order Query Product",
    description: "desc",
    category: "toys",
    price: 1000,
    stock: 50,
    isActive: true,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["dog"],
    soldCount: 0,
    ...overrides,
  });
}

async function makeOrder(userId, product, overrides = {}) {
  counter += 1;
  return Order.create({
    userId,
    items: [{ productId: product._id, name: product.name, priceAtPurchase: product.price, quantity: 1 }],
    shippingAddress: { fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" },
    totalAmount: product.price,
    shippingFee: 0,
    paymentIntentId: `pi_orderquery_${counter}_${Date.now()}`,
    paymentStatus: "paid",
    status: "processing",
    ...overrides,
  });
}

describe("GET /api/v1/orders — user's own orders", () => {
  it("only returns the caller's own orders", async () => {
    const a = await registerAndLogin("orderquery1@test.com");
    const b = await registerAndLogin("orderquery2@test.com");
    const product = await makeProduct();
    await makeOrder(a.userId, product);
    await makeOrder(b.userId, product);

    const res = await request(app).get("/api/v1/orders").set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
  });

  it("filters by status", async () => {
    const { userId, token } = await registerAndLogin("orderquery3@test.com");
    const product = await makeProduct();
    await makeOrder(userId, product, { status: "delivered" });
    await makeOrder(userId, product, { status: "processing" });

    const res = await request(app).get("/api/v1/orders?status=delivered").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.orders[0].status).toBe("delivered");
  });
});

describe("GET /api/v1/orders/:orderId — single order, ownership enforced", () => {
  it("returns the order to its owner", async () => {
    const { userId, token } = await registerAndLogin("orderdetail1@test.com");
    const product = await makeProduct();
    const order = await makeOrder(userId, product);

    const res = await request(app).get(`/api/v1/orders/${order._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.order._id).toBe(String(order._id));
  });

  it("refuses to show the order to a different user (IDOR)", async () => {
    const owner = await registerAndLogin("orderdetail2@test.com");
    const intruder = await registerAndLogin("orderdetail3@test.com");
    const product = await makeProduct();
    const order = await makeOrder(owner.userId, product);

    const res = await request(app).get(`/api/v1/orders/${order._id}`).set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });

  it("404s for a nonexistent order", async () => {
    const { token } = await registerAndLogin("orderdetail4@test.com");
    const res = await request(app).get(`/api/v1/orders/${new mongoose.Types.ObjectId()}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/orders/admin/all-orders — admin only", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("orderadmin1@test.com");
    const res = await request(app).get("/api/v1/orders/admin/all-orders").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("lists all orders across users with revenue statistics", async () => {
    const admin = await makeAdmin();
    const a = await registerAndLogin("orderadmin2@test.com");
    const b = await registerAndLogin("orderadmin3@test.com");
    const product = await makeProduct();
    await makeOrder(a.userId, product, { totalAmount: 1000 });
    await makeOrder(b.userId, product, { totalAmount: 2000 });

    const res = await request(app).get("/api/v1/orders/admin/all-orders").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.statistics.totalRevenue).toBeGreaterThanOrEqual(3000);
  });
});

describe("GET /api/v1/orders/admin/bestsellers — admin only", () => {
  it("rejects a non-admin", async () => {
    const { token } = await registerAndLogin("orderadmin4@test.com");
    const res = await request(app).get("/api/v1/orders/admin/bestsellers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("ranks active products by soldCount", async () => {
    const admin = await makeAdmin();
    await makeProduct({ name: "Popular", soldCount: 50 });
    await makeProduct({ name: "Unpopular", soldCount: 1 });

    const res = await request(app).get("/api/v1/orders/admin/bestsellers?limit=5").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bestsellers[0].name).toBe("Popular");
  });
});
