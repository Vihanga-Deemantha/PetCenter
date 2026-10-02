import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import Product from "../src/models/Products.js";
import Order from "../src/models/Order.js";
import PendingCheckout from "../src/models/PendingCheckout.js";
import Donation from "../src/models/Donation.js";
import Campaign from "../src/models/Campaign.js";
import User from "../src/models/User.js";

const retrieveMock = vi.fn();
const refundsCreateMock = vi.fn().mockResolvedValue({ id: "re_test" });
const constructEventMock = vi.fn((rawBody) => JSON.parse(rawBody.toString()));

vi.mock("../src/config/stripe.js", () => ({
  default: {
    paymentIntents: { retrieve: (...args) => retrieveMock(...args) },
    refunds: { create: (...args) => refundsCreateMock(...args) },
    webhooks: { constructEvent: (...args) => constructEventMock(...args) },
  },
}));

const { default: app } = await import("../app.js");

const postWebhook = (event) =>
  request(app)
    .post("/api/v1/webhooks/stripe")
    .set("Stripe-Signature", "t=1,v1=fake") // unchecked — constructEvent is mocked
    .set("Content-Type", "application/json")
    .send(JSON.stringify(event));

async function makeProduct(overrides = {}) {
  return Product.create({
    name: "Webhook Test Product",
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

async function makeCampaign() {
  const admin = await User.create({
    name: "Admin",
    email: `admin_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
    phone: "1234567890",
    location: "Test City",
    role: "admin",
  });
  return Campaign.create({
    title: "Campaign",
    shortDescription: "short",
    description: "desc",
    goalAmount: 100000,
    category: "medical",
    status: "active",
    createdBy: admin._id,
    images: [{ url: "http://example.com/a.png", publicId: "a" }],
  });
}

beforeEach(() => {
  retrieveMock.mockReset();
  refundsCreateMock.mockClear();
  constructEventMock.mockClear();
});

describe("POST /api/v1/webhooks/stripe — signature + routing", () => {
  it("rejects a request with no Stripe-Signature header", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "payment_intent.succeeded" }));
    expect(res.status).toBe(401);
  });

  it("acknowledges but ignores an unhandled event type", async () => {
    const res = await postWebhook({ type: "customer.created", data: { object: {} } });
    expect(res.status).toBe(200);
  });

  it("rejects a payment_intent.succeeded event with no metadata.type", async () => {
    const res = await postWebhook({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_no_type", metadata: {} } },
    });
    expect(res.status).toBe(400);
  });
});

describe("payment_intent.succeeded — checkout", () => {
  it("creates an order from the PendingCheckout snapshot on success", async () => {
    const product = await makeProduct();
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_checkout_success";

    await PendingCheckout.create({
      paymentIntentId,
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      subtotal: 1000,
      shippingFee: 599,
      totalAmount: 1599,
    });
    retrieveMock.mockResolvedValue({ status: "succeeded", amount: 1599 });

    const res = await postWebhook({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: paymentIntentId,
          metadata: {
            type: "checkout",
            userId: userId.toString(),
            shippingAddress: JSON.stringify({ fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" }),
          },
        },
      },
    });

    expect(res.status).toBe(200);
    const order = await Order.findOne({ paymentIntentId });
    expect(order).toBeTruthy();
    expect(order.paymentStatus).toBe("paid");
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });

  it("refunds automatically when order verification fails (no snapshot found)", async () => {
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_checkout_no_snapshot";
    retrieveMock.mockResolvedValue({ status: "succeeded", amount: 1599 });

    const res = await postWebhook({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: paymentIntentId,
          metadata: {
            type: "checkout",
            userId: userId.toString(),
            shippingAddress: JSON.stringify({ fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" }),
          },
        },
      },
    });

    expect(res.status).toBe(200); // webhooks always ack 200
    expect(refundsCreateMock).toHaveBeenCalledTimes(1);
    const order = await Order.findOne({ paymentIntentId });
    expect(order).toBeNull();
  });

  it("is idempotent — a duplicate delivery for an already-created order does not reprocess", async () => {
    const product = await makeProduct();
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_checkout_duplicate";

    await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress: { fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" },
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId,
      paymentStatus: "paid",
      status: "processing",
    });

    const res = await postWebhook({
      type: "payment_intent.succeeded",
      data: { object: { id: paymentIntentId, metadata: { type: "checkout", userId: userId.toString() } } },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.duplicate).toBe(true);
    expect(retrieveMock).not.toHaveBeenCalled(); // short-circuited before even checking Stripe
    const orders = await Order.find({ paymentIntentId });
    expect(orders).toHaveLength(1);
  });
});

describe("payment_intent.succeeded — donation", () => {
  it("creates a completed donation and credits the campaign", async () => {
    const campaign = await makeCampaign();
    const paymentIntentId = "pi_donation_webhook";

    const res = await postWebhook({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: paymentIntentId,
          amount: 2500,
          metadata: { type: "donation", campaignId: campaign._id.toString(), userId: "", displayName: "Donor", message: "" },
        },
      },
    });

    expect(res.status).toBe(200);
    const donation = await Donation.findOne({ stripePaymentIntentId: paymentIntentId });
    expect(donation.status).toBe("completed");
    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign.raisedAmount).toBe(2500);
  });
});

describe("charge.refunded", () => {
  it("marks a matching order refunded and restores stock", async () => {
    const product = await makeProduct({ stock: 3 });
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_refund_order";
    await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 2 }],
      shippingAddress: { fullName: "A", addressLine1: "1 Main St", city: "Colombo", country: "Sri Lanka", postalCode: "00100" },
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId,
      paymentStatus: "paid",
      status: "processing",
    });

    const res = await postWebhook({
      type: "charge.refunded",
      data: { object: { payment_intent: paymentIntentId } },
    });

    expect(res.status).toBe(200);
    const order = await Order.findOne({ paymentIntentId });
    expect(order.paymentStatus).toBe("refunded");
    expect(order.status).toBe("cancelled");
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(5); // 3 + 2 restored
  });

  it("marks a matching donation refunded and reverses the campaign total", async () => {
    const campaign = await makeCampaign();
    await Campaign.findByIdAndUpdate(campaign._id, { raisedAmount: 2500, donorCount: 1 });
    const paymentIntentId = "pi_refund_donation";
    await Donation.create({
      campaignId: campaign._id,
      amount: 2500,
      stripePaymentIntentId: paymentIntentId,
      status: "completed",
      displayName: "Donor",
    });

    const res = await postWebhook({
      type: "charge.refunded",
      data: { object: { payment_intent: paymentIntentId } },
    });

    expect(res.status).toBe(200);
    const donation = await Donation.findOne({ stripePaymentIntentId: paymentIntentId });
    expect(donation.status).toBe("refunded");
    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign.raisedAmount).toBe(0);
  });
});

describe("payment_intent.payment_failed", () => {
  it("marks a pending donation as failed", async () => {
    const campaign = await makeCampaign();
    const paymentIntentId = "pi_donation_failed";
    await Donation.create({
      campaignId: campaign._id,
      amount: 1000,
      stripePaymentIntentId: paymentIntentId,
      status: "pending",
      displayName: "Donor",
    });

    const res = await postWebhook({
      type: "payment_intent.payment_failed",
      data: { object: { id: paymentIntentId, metadata: { type: "donation" } } },
    });

    expect(res.status).toBe(200);
    const donation = await Donation.findOne({ stripePaymentIntentId: paymentIntentId });
    expect(donation.status).toBe("failed");
  });
});
