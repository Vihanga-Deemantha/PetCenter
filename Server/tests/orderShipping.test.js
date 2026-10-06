import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import Product from "../src/models/Products.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

const createMock = vi.fn();
const refundCreateMock = vi.fn();
vi.mock("../src/config/stripe.js", () => ({
  default: {
    paymentIntents: {
      create: (...args) => createMock(...args),
      retrieve: vi.fn(),
    },
    refunds: {
      create: (...args) => refundCreateMock(...args),
    },
  },
}));

const { default: app } = await import("../app.js");

beforeEach(() => {
  refundCreateMock.mockReset();
  refundCreateMock.mockResolvedValue({ id: "re_test" });
});

async function registerAndLogin(email) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Order Test User",
    email,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
  });
  return { userId: res.body.data.user._id, token: res.body.data.accessToken };
}

async function registerAdmin(email) {
  const { userId, token } = await registerAndLogin(email);
  await User.findByIdAndUpdate(userId, { role: "admin" });
  return { userId, token };
}

const shippingAddress = {
  fullName: "A",
  addressLine1: "1 Main St",
  city: "Colombo",
  country: "Sri Lanka",
  postalCode: "00100",
};

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Test Product",
    description: "d",
    category: "accessories",
    stock: 10,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["bird"],
    ...overrides,
  });
}

describe("POST /api/v1/orders/create-payment-intent — shipping fee", () => {
  beforeEach(() => createMock.mockReset());

  it("adds the flat fee when the subtotal is under the free-shipping threshold", async () => {
    const { userId, token } = await registerAndLogin("ship1@test.com");
    const product = await makeProduct({ price: 2000 }); // $20
    await Cart.create({ userId, items: [{ productId: product._id, quantity: 1, priceAtAdd: 2000 }] });

    createMock.mockResolvedValue({ id: "pi_test_1", client_secret: "secret_1" });

    const res = await request(app)
      .post("/api/v1/orders/create-payment-intent")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(2000);
    expect(res.body.data.shippingFee).toBe(599);
    expect(res.body.data.totalAmount).toBe(2599);
    // The customer must be charged exactly what they're shown — the Stripe
    // amount has to include the fee, not just the item subtotal.
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 2599 }));
  });

  it("waives the fee once the subtotal reaches the free-shipping threshold", async () => {
    const { userId, token } = await registerAndLogin("ship2@test.com");
    const product = await makeProduct({ price: 8000 }); // $80
    await Cart.create({ userId, items: [{ productId: product._id, quantity: 1, priceAtAdd: 8000 }] });

    createMock.mockResolvedValue({ id: "pi_test_2", client_secret: "secret_2" });

    const res = await request(app)
      .post("/api/v1/orders/create-payment-intent")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.status).toBe(200);
    expect(res.body.data.shippingFee).toBe(0);
    expect(res.body.data.totalAmount).toBe(8000);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 8000 }));
  });
});

describe("PUT /api/v1/orders/:orderId/status — tracking info + status history", () => {
  it("records tracking number, carrier, and a history entry when marked shipped", async () => {
    const { userId, token } = await registerAdmin("orderadmin1@test.com");
    const order = await Order.create({
      userId,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "X", priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress,
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_1",
      status: "processing",
      statusHistory: [{ status: "processing", changedAt: new Date(), note: "Order placed" }],
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "shipped", trackingNumber: "1Z999AA10123456784", carrier: "UPS", note: "Left the warehouse" });

    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("shipped");
    expect(updated.trackingNumber).toBe("1Z999AA10123456784");
    expect(updated.carrier).toBe("UPS");
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1].status).toBe("shipped");
    expect(updated.statusHistory[1].note).toBe("Left the warehouse");
  });

  it("does not require tracking info to change status", async () => {
    const { userId, token } = await registerAdmin("orderadmin2@test.com");
    const order = await Order.create({
      userId,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "X", priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress,
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_3",
      status: "processing",
      statusHistory: [{ status: "processing", changedAt: new Date(), note: "Order placed" }],
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("delivered");
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1].status).toBe("delivered");
  });

  it("rejects backward status transitions", async () => {
    const { userId, token } = await registerAdmin("orderadmin-backward@test.com");
    const order = await Order.create({
      userId,
      items: [{ productId: new mongoose.Types.ObjectId(), name: "X", priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress,
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_backward",
      status: "shipped",
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "processing" });

    expect(res.status).toBe(400);
    expect((await Order.findById(order._id)).status).toBe("shipped");
  });

  it("does not cancel and restock an order that has already shipped", async () => {
    const { userId, token } = await registerAdmin("orderadmin-shipped@test.com");
    const product = await makeProduct({ price: 1000, stock: 4 });
    const order = await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress,
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_shipped_cancel",
      status: "shipped",
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(400);
    expect((await Order.findById(order._id)).status).toBe("shipped");
    expect((await Product.findById(product._id)).stock).toBe(4);
  });
});

describe("PUT /api/v1/orders/:orderId/cancel — status history", () => {
  it("appends a cancelled entry noting the customer initiated it", async () => {
    const { userId, token } = await registerAndLogin("ordercancel1@test.com");
    const product = await makeProduct({ price: 2000, stock: 5 });
    const order = await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 2000, quantity: 1 }],
      shippingAddress,
      totalAmount: 2599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_2",
      status: "processing",
      statusHistory: [{ status: "processing", changedAt: new Date(), note: "Order placed" }],
    });

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("cancelled");
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1]).toMatchObject({ status: "cancelled", note: "Cancelled by customer" });
  });

  it("records a pending refund honestly when Stripe refunding fails", async () => {
    const { userId, token } = await registerAndLogin("ordercancel-refund-failure@test.com");
    const product = await makeProduct({ price: 2000, stock: 5 });
    const order = await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 2000, quantity: 1 }],
      shippingAddress,
      totalAmount: 2599,
      shippingFee: 599,
      paymentIntentId: "pi_manual_refund_failure",
      status: "processing",
    });
    refundCreateMock.mockRejectedValueOnce(new Error("Stripe temporarily unavailable"));

    const res = await request(app)
      .put(`/api/v1/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(502);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("cancelled");
    expect(updated.paymentStatus).toBe("refund_pending");
    expect((await Product.findById(product._id)).stock).toBe(6);
  });
});
