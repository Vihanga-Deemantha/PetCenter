import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import Product from "../src/models/Products.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import PendingCheckout from "../src/models/PendingCheckout.js";

const retrieveMock = vi.fn();

vi.mock("../src/config/stripe.js", () => ({
  default: {
    paymentIntents: {
      retrieve: (...args) => retrieveMock(...args),
      create: vi.fn(),
    },
    refunds: { create: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
}));

const { default: app } = await import("../app.js");

const shippingAddress = {
  fullName: "Checkout User",
  addressLine1: "42 Test Lane",
  addressLine2: "",
  city: "Colombo",
  country: "Sri Lanka",
  postalCode: "00100",
};

async function register(email) {
  const response = await request(app).post("/api/v1/auth/register").send({
    name: "Checkout User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Colombo",
  });
  return {
    userId: response.body.data.user._id,
    token: response.body.data.accessToken,
  };
}

async function createCheckout(userId, paymentIntentId = "pi_confirm_success") {
  const product = await Product.create({
    name: "Confirmation Product",
    description: "A checkout confirmation test product",
    category: "toys",
    price: 1000,
    stock: 5,
    images: [{ url: "https://example.com/product.png", publicId: "product" }],
    compatiblePets: ["dog"],
  });

  await Cart.create({
    userId,
    items: [{ productId: product._id, quantity: 1, priceAtAdd: 1000 }],
  });
  await PendingCheckout.create({
    paymentIntentId,
    userId,
    items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
    subtotal: 1000,
    shippingFee: 599,
    totalAmount: 1599,
    shippingAddress,
  });

  return product;
}

beforeEach(() => {
  retrieveMock.mockReset();
});

describe("POST /api/v1/orders/confirm-payment", () => {
  it("requires authentication and a valid PaymentIntent id", async () => {
    expect((await request(app).post("/api/v1/orders/confirm-payment").send({ paymentIntentId: "pi_x" })).status).toBe(401);

    const { token } = await register("confirm-invalid@test.com");
    const response = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "not-a-payment-intent" });
    expect(response.status).toBe(400);
  });

  it("creates a durable order, decrements stock, and removes only the paid cart quantity", async () => {
    const { userId, token } = await register("confirm-success@test.com");
    const product = await createCheckout(userId);
    retrieveMock.mockResolvedValue({
      id: "pi_confirm_success",
      status: "succeeded",
      amount: 1599,
      metadata: { userId: String(userId) },
    });

    const response = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_confirm_success" });

    expect(response.status).toBe(200);
    expect(response.body.data.order.paymentIntentId).toBe("pi_confirm_success");
    expect(response.body.data.order.shippingAddress).toMatchObject(shippingAddress);
    expect(await Order.countDocuments({ paymentIntentId: "pi_confirm_success" })).toBe(1);
    expect((await Product.findById(product._id)).stock).toBe(4);
    expect((await Cart.findOne({ userId })).items).toHaveLength(0);
    expect(await PendingCheckout.findOne({ paymentIntentId: "pi_confirm_success" })).toBeNull();
  });

  it("is idempotent after the checkout snapshot has been consumed", async () => {
    const { userId, token } = await register("confirm-idempotent@test.com");
    await createCheckout(userId, "pi_confirm_idempotent");
    retrieveMock.mockResolvedValue({
      id: "pi_confirm_idempotent",
      status: "succeeded",
      amount: 1599,
      metadata: { userId: String(userId) },
    });

    const first = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_confirm_idempotent" });
    const second = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_confirm_idempotent" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyConfirmed).toBe(true);
    expect(second.body.data.order._id).toBe(first.body.data.order._id);
    expect(retrieveMock).toHaveBeenCalledTimes(1);
  });

  it("does not let another account confirm someone else's checkout", async () => {
    const owner = await register("confirm-owner@test.com");
    const intruder = await register("confirm-intruder@test.com");
    await createCheckout(owner.userId, "pi_confirm_owned");

    const response = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ paymentIntentId: "pi_confirm_owned" });

    expect(response.status).toBe(403);
    expect(retrieveMock).not.toHaveBeenCalled();
    expect(await Order.countDocuments({ paymentIntentId: "pi_confirm_owned" })).toBe(0);
  });

  it("keeps the checkout intact when Stripe has not marked the payment successful", async () => {
    const { userId, token } = await register("confirm-incomplete@test.com");
    await createCheckout(userId, "pi_confirm_incomplete");
    retrieveMock.mockResolvedValue({
      id: "pi_confirm_incomplete",
      status: "requires_payment_method",
      amount: 1599,
      metadata: { userId: String(userId) },
    });

    const response = await request(app)
      .post("/api/v1/orders/confirm-payment")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentIntentId: "pi_confirm_incomplete" });

    expect(response.status).toBe(409);
    expect(await Order.countDocuments({ paymentIntentId: "pi_confirm_incomplete" })).toBe(0);
    expect(await PendingCheckout.findOne({ paymentIntentId: "pi_confirm_incomplete" })).toBeTruthy();
  });
});
