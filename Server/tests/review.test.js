import { describe, it, expect } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

const { default: app } = await import("../app.js");

let orderCounter = 0;

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Review Test User",
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
    name: "Reviewable Product",
    description: "desc",
    category: "toys",
    price: 1500,
    stock: 10,
    isActive: true,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["dog"],
    ...overrides,
  });
}

// Reviews require a genuinely "delivered" order containing the product.
async function makeDeliveredOrder(userId, product, quantity = 1) {
  orderCounter += 1;
  return Order.create({
    userId,
    items: [{ productId: product._id, name: product.name, priceAtPurchase: product.price, quantity }],
    shippingAddress: { fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" },
    totalAmount: product.price * quantity,
    shippingFee: 0,
    paymentIntentId: `pi_review_test_${orderCounter}_${Date.now()}`,
    paymentStatus: "paid",
    status: "delivered",
  });
}

describe("GET /api/v1/products/:id/reviews", () => {
  it("returns an empty list with a zeroed distribution for a product with no reviews", async () => {
    const product = await makeProduct();
    const res = await request(app).get(`/api/v1/products/${product._id}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });
});

describe("POST /api/v1/products/:id/reviews — verified purchase required", () => {
  it("rejects a review with no matching delivered order", async () => {
    const { token } = await registerAndLogin("noorder@test.com");
    const product = await makeProduct();

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 5, comment: "Great!", orderId: "000000000000000000000000" });

    expect(res.status).toBe(403);
  });

  it("rejects an order that doesn't actually contain this product", async () => {
    const { userId, token } = await registerAndLogin("wrongproduct@test.com");
    const reviewedProduct = await makeProduct({ name: "A" });
    const otherProduct = await makeProduct({ name: "B" });
    const order = await makeDeliveredOrder(userId, otherProduct);

    const res = await request(app)
      .post(`/api/v1/products/${reviewedProduct._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 5, comment: "Great!", orderId: order._id });

    expect(res.status).toBe(403);
  });

  it("rejects an order that belongs to a different user", async () => {
    const owner = await registerAndLogin("orderowner@test.com");
    const intruder = await registerAndLogin("orderintruder@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(owner.userId, product);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ rating: 5, comment: "Not my order", orderId: order._id });

    expect(res.status).toBe(403);
  });

  it("rejects a rating outside 1-5", async () => {
    const { userId, token } = await registerAndLogin("badrating@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 6, comment: "x", orderId: order._id });

    expect(res.status).toBe(400);
  });

  it("creates a review and correctly recalculates the product's averageRating/reviewCount", async () => {
    const { userId, token } = await registerAndLogin("goodreview@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 4, comment: "Pretty good", orderId: order._id });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(4);

    // Regression test: recalculateProductRating used to pass a raw string
    // productId straight to an aggregation $match, which never matches the
    // ObjectId-typed field and silently zeroed the rating on every review.
    const updated = await Product.findById(product._id);
    expect(updated.averageRating).toBe(4);
    expect(updated.reviewCount).toBe(1);
  });

  it("strips HTML from the comment", async () => {
    const { userId, token } = await registerAndLogin("xssreview@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);

    const res = await request(app)
      .post(`/api/v1/products/${product._id}/reviews`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 5, comment: "<script>alert(1)</script>Nice!", orderId: order._id });

    expect(res.status).toBe(201);
    expect(res.body.data.comment).not.toContain("<script>");
    expect(res.body.data.comment).toContain("Nice!");
  });

  it("rejects a second review for the same order (duplicate)", async () => {
    const { userId, token } = await registerAndLogin("dupreview@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);

    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "first", orderId: order._id });
    const res = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 3, comment: "second", orderId: order._id });

    expect(res.status).toBe(409);
  });

  it("recalculates correctly across multiple reviews on the same product", async () => {
    const product = await makeProduct();
    const a = await registerAndLogin("multi1@test.com");
    const b = await registerAndLogin("multi2@test.com");
    const orderA = await makeDeliveredOrder(a.userId, product);
    const orderB = await makeDeliveredOrder(b.userId, product);

    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${a.token}`).send({ rating: 5, comment: "a", orderId: orderA._id });
    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${b.token}`).send({ rating: 3, comment: "b", orderId: orderB._id });

    const updated = await Product.findById(product._id);
    expect(updated.reviewCount).toBe(2);
    expect(updated.averageRating).toBe(4); // (5+3)/2
  });
});

describe("GET /api/v1/products/:id/reviews/eligibility", () => {
  it("reports ineligible with no purchase", async () => {
    const { token } = await registerAndLogin("noelig@test.com");
    const product = await makeProduct();
    const res = await request(app).get(`/api/v1/products/${product._id}/reviews/eligibility`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.canReview).toBe(false);
    expect(res.body.data.reason).toBe("no_purchase");
  });

  it("reports eligible with a delivered order and no existing review", async () => {
    const { userId, token } = await registerAndLogin("eligok@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    const res = await request(app).get(`/api/v1/products/${product._id}/reviews/eligibility`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.canReview).toBe(true);
    expect(res.body.data.orderId).toBe(String(order._id));
  });

  it("reports already_reviewed once a review exists for that order", async () => {
    const { userId, token } = await registerAndLogin("eligdone@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "done", orderId: order._id });

    const res = await request(app).get(`/api/v1/products/${product._id}/reviews/eligibility`).set("Authorization", `Bearer ${token}`);
    expect(res.body.data.canReview).toBe(false);
    expect(res.body.data.reason).toBe("already_reviewed");
  });
});

describe("PUT /api/v1/reviews/:id — owner only, 48h window", () => {
  it("forbids a non-owner from editing", async () => {
    const owner = await registerAndLogin("editowner@test.com");
    const intruder = await registerAndLogin("editintruder@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(owner.userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${owner.token}`).send({ rating: 5, comment: "x", orderId: order._id });

    const res = await request(app).put(`/api/v1/reviews/${review.body.data._id}`).set("Authorization", `Bearer ${intruder.token}`).send({ rating: 1 });
    expect(res.status).toBe(403);
  });

  it("allows the owner to edit within the window and recalculates the rating", async () => {
    const { userId, token } = await registerAndLogin("editok@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 2, comment: "meh", orderId: order._id });

    const res = await request(app).put(`/api/v1/reviews/${review.body.data._id}`).set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "actually great" });
    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(5);

    const updated = await Product.findById(product._id);
    expect(updated.averageRating).toBe(5);
  });
});

describe("DELETE /api/v1/reviews/:id — owner only, 48h window", () => {
  it("forbids a non-owner from deleting", async () => {
    const owner = await registerAndLogin("delowner@test.com");
    const intruder = await registerAndLogin("delintruder@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(owner.userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${owner.token}`).send({ rating: 5, comment: "x", orderId: order._id });

    const res = await request(app).delete(`/api/v1/reviews/${review.body.data._id}`).set("Authorization", `Bearer ${intruder.token}`);
    expect(res.status).toBe(403);
  });

  it("allows the owner to delete within the window and recalculates the rating back down", async () => {
    const { userId, token } = await registerAndLogin("delok@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 5, comment: "x", orderId: order._id });

    const res = await request(app).delete(`/api/v1/reviews/${review.body.data._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const updated = await Product.findById(product._id);
    expect(updated.reviewCount).toBe(0);
    expect(updated.averageRating).toBe(0);
  });
});

describe("GET /api/v1/reviews/testimonials", () => {
  it("only returns 5-star reviews that have a comment", async () => {
    const product = await makeProduct();
    const fiveStar = await registerAndLogin("testimonial5@test.com");
    const threeStar = await registerAndLogin("testimonial3@test.com");
    const order5 = await makeDeliveredOrder(fiveStar.userId, product);
    const order3 = await makeDeliveredOrder(threeStar.userId, product);

    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${fiveStar.token}`).send({ rating: 5, comment: "Loved it", orderId: order5._id });
    await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${threeStar.token}`).send({ rating: 3, comment: "It was fine", orderId: order3._id });

    const res = await request(app).get("/api/v1/reviews/testimonials");
    expect(res.status).toBe(200);
    expect(res.body.data.every((r) => r.rating === 5)).toBe(true);
  });
});

describe("Admin review moderation", () => {
  it("forbids a non-admin from listing all reviews or hiding one", async () => {
    const { userId, token } = await registerAndLogin("notadmin@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 1, comment: "bad", orderId: order._id });

    const listRes = await request(app).get("/api/v1/reviews/admin").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(403);

    const hideRes = await request(app).patch(`/api/v1/reviews/${review.body.data._id}/hide`).set("Authorization", `Bearer ${token}`);
    expect(hideRes.status).toBe(403);
  });

  it("lets an admin hide a review, excluding it from the public rating afterward", async () => {
    const admin = await makeAdmin();
    const { userId, token } = await registerAndLogin("gethidden@test.com");
    const product = await makeProduct();
    const order = await makeDeliveredOrder(userId, product);
    const review = await request(app).post(`/api/v1/products/${product._id}/reviews`).set("Authorization", `Bearer ${token}`).send({ rating: 1, comment: "bad", orderId: order._id });

    const hideRes = await request(app).patch(`/api/v1/reviews/${review.body.data._id}/hide`).set("Authorization", `Bearer ${admin.token}`);
    expect(hideRes.status).toBe(200);
    expect(hideRes.body.data.isVisible).toBe(false);

    const updated = await Product.findById(product._id);
    expect(updated.reviewCount).toBe(0); // hidden reviews don't count

    const publicRes = await request(app).get(`/api/v1/products/${product._id}/reviews`);
    expect(publicRes.body.data).toHaveLength(0);
  });
});
