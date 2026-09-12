import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import Product from "../src/models/Products.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";

// verifyPayment always calls stripe.paymentIntents.retrieve first — mock it
// so the test never talks to the real Stripe API.
vi.mock("../src/config/stripe.js", () => ({
  default: {
    paymentIntents: {
      retrieve: vi.fn().mockResolvedValue({ status: "succeeded" }),
    },
  },
}));

const { verifyPayment } = await import("../src/controllers/order.controller.js");

const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Test Water Bottle",
    description: "A bottle for testing",
    category: "accessories",
    price: 500,
    stock: 1,
    images: [{ url: "https://example.com/a.png", publicId: "a" }],
    compatiblePets: ["bird"],
    ...overrides,
  });

const makeCart = (userId, productId, quantity = 1, priceAtAdd = 500) =>
  Cart.create({ userId, items: [{ productId, quantity, priceAtAdd }] });

describe("verifyPayment — stock integrity", () => {
  it("decrements stock atomically and creates an order on success", async () => {
    const product = await makeProduct({ stock: 5 });
    const userId = new mongoose.Types.ObjectId();
    await makeCart(userId, product._id, 2, 500);

    const result = await verifyPayment(userId, "pi_success_1", {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    });

    expect(result.success).toBe(true);

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(3);
    expect(updated.soldCount).toBe(2);

    const order = await Order.findById(result.orderId);
    expect(order.totalAmount).toBe(1000);
  });

  it("never oversells when two checkouts race for the last unit", async () => {
    const product = await makeProduct({ stock: 1 });
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    await makeCart(userA, product._id, 1, 500);
    await makeCart(userB, product._id, 1, 500);

    const shippingAddress = {
      fullName: "A",
      addressLine1: "1 Main St",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "00100",
    };

    // Both requests race to buy the same single unit of stock.
    const [resultA, resultB] = await Promise.all([
      verifyPayment(userA, "pi_race_a", shippingAddress),
      verifyPayment(userB, "pi_race_b", shippingAddress),
    ]);

    const results = [resultA, resultB];
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const finalProduct = await Product.findById(product._id);
    expect(finalProduct.stock).toBe(0); // never negative, never still 1

    // Exactly one order was actually created for this race
    const allOrders = await Order.find({});
    expect(allOrders).toHaveLength(1);
  });
});
