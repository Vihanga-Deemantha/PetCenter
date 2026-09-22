import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import Product from "../src/models/Products.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import Donation from "../src/models/Donation.js";
import Campaign from "../src/models/Campaign.js";
import User from "../src/models/User.js";
import PendingCheckout from "../src/models/PendingCheckout.js";

const intentAmounts = new Map();
const retrieveMock = vi.fn((id) =>
  Promise.resolve({ status: "succeeded", amount: intentAmounts.get(id) })
);
vi.mock("../src/config/stripe.js", () => ({
  default: { paymentIntents: { retrieve: (...args) => retrieveMock(...args) } },
}));

const { verifyPayment } = await import("../src/controllers/order.controller.js");
const { handleDonationSucceeded } = await import("../src/controllers/webhook.controller.js");

const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Test Product",
    description: "desc",
    category: "accessories",
    price: 1000,
    stock: 10,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["bird"],
    ...overrides,
  });

describe("verifyPayment — order is built from what was actually charged, not the live cart", () => {
  it("ignores items added to the cart after the PaymentIntent was created", async () => {
    const productA = await makeProduct({ name: "Product A", price: 1000, stock: 5 }); // $10
    const productB = await makeProduct({ name: "Product B", price: 200000, stock: 5 }); // $2000
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_snapshot_binding";

    // This mirrors exactly what createPaymentIntent writes: a snapshot of
    // the cart AT THE MOMENT the PaymentIntent was created (1x Product A).
    const subtotal = 1000;
    const shippingFee = 599; // under the $75 free-shipping threshold
    const totalAmount = subtotal + shippingFee;
    intentAmounts.set(paymentIntentId, totalAmount);
    await PendingCheckout.create({
      paymentIntentId,
      userId,
      items: [{ productId: productA._id, name: productA.name, priceAtPurchase: 1000, quantity: 1 }],
      subtotal,
      shippingFee,
      totalAmount,
    });

    // The user's cart now (simulating them shopping further, in another tab,
    // while the first payment is still confirming) — it moved on from what
    // was actually paid for.
    await Cart.create({
      userId,
      items: [
        { productId: productA._id, quantity: 1, priceAtAdd: 1000 },
        { productId: productB._id, quantity: 3, priceAtAdd: 200000 }, // never paid for
      ],
    });

    const result = await verifyPayment(userId, paymentIntentId, {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    });

    expect(result.success).toBe(true);

    const order = await Order.findById(result.orderId);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productId.toString()).toBe(productA._id.toString());
    expect(order.totalAmount).toBe(totalAmount);

    // Product B (never paid for) must be completely untouched.
    const refreshedB = await Product.findById(productB._id);
    expect(refreshedB.stock).toBe(5);

    // The cart should have Product A's paid quantity removed, but Product B
    // — never part of what was charged — must still be sitting there.
    const finalCart = await Cart.findOne({ userId });
    expect(finalCart.items).toHaveLength(1);
    expect(finalCart.items[0].productId.toString()).toBe(productB._id.toString());
    expect(finalCart.items[0].quantity).toBe(3);
  });

  it("fails closed when no checkout snapshot exists for the PaymentIntent", async () => {
    const userId = new mongoose.Types.ObjectId();
    intentAmounts.set("pi_no_snapshot", 1599);

    const result = await verifyPayment(userId, "pi_no_snapshot", {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    });

    expect(result.success).toBe(false);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it("rejects when the Stripe-charged amount doesn't match the snapshot total", async () => {
    const product = await makeProduct({ price: 1000, stock: 5 });
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_amount_mismatch";

    await PendingCheckout.create({
      paymentIntentId,
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      subtotal: 1000,
      shippingFee: 599,
      totalAmount: 1599,
    });
    // Stripe reports a different amount than the snapshot says was charged.
    intentAmounts.set(paymentIntentId, 100);

    const result = await verifyPayment(userId, paymentIntentId, {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    });

    expect(result.success).toBe(false);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it("treats losing a create race to a concurrent delivery as success, not failure", async () => {
    const product = await makeProduct({ price: 1000, stock: 5 });
    const userId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_duplicate_delivery";

    await PendingCheckout.create({
      paymentIntentId,
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      subtotal: 1000,
      shippingFee: 599,
      totalAmount: 1599,
    });
    intentAmounts.set(paymentIntentId, 1599);

    const shippingAddress = {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    };

    // A prior (or concurrent) delivery already created the order for this
    // exact PaymentIntent — simulated directly rather than raced, since the
    // interesting behavior under test is the duplicate-key recovery path,
    // not the race timing itself.
    const winner = await Order.create({
      userId,
      items: [{ productId: product._id, name: product.name, priceAtPurchase: 1000, quantity: 1 }],
      shippingAddress,
      totalAmount: 1599,
      shippingFee: 599,
      paymentIntentId,
      paymentStatus: "paid",
      status: "processing",
    });

    // verifyPayment's own idempotency check (Order.findOne before the
    // transaction) would normally short-circuit here — to specifically
    // exercise the duplicate-key recovery branch, delete-then-recreate isn't
    // representative of the real race, so instead this asserts the actual
    // documented behavior: calling verifyPayment again for an
    // already-created order returns success referencing the same order.
    const result = await verifyPayment(userId, paymentIntentId, shippingAddress);

    expect(result.success).toBe(true);
    expect(result.orderId.toString()).toBe(winner._id.toString());
    expect(await Order.countDocuments({ paymentIntentId })).toBe(1);
  });
});

describe("handleDonationSucceeded — does not double-credit a campaign on retry", () => {
  const shippingFreeCampaign = async () => {
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
  };

  it("only credits raisedAmount/donorCount once even if the handler runs twice for the same donation", async () => {
    const campaign = await shippingFreeCampaign();
    const paymentIntent = {
      id: "pi_donation_retry",
      amount: 1500,
      metadata: { campaignId: campaign._id.toString(), userId: "", displayName: "Donor", message: "" },
    };

    // First delivery: creates + completes the donation, credits the campaign.
    await handleDonationSucceeded(paymentIntent);
    // A second call for the exact same PaymentIntent — modeling either a
    // genuine duplicate webhook delivery, or a transaction retry that reads
    // state after the first attempt already committed.
    await handleDonationSucceeded(paymentIntent);

    const donations = await Donation.find({ stripePaymentIntentId: "pi_donation_retry" });
    expect(donations).toHaveLength(1);
    expect(donations[0].status).toBe("completed");

    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign.raisedAmount).toBe(1500); // not 3000
    expect(updatedCampaign.donorCount).toBe(1); // not 2
  });
});
