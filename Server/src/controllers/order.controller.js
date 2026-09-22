import mongoose from "mongoose";
import stripe from "../config/stripe.js";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";
import PendingCheckout from "../models/PendingCheckout.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { validateCartStock } from "./cart.controller.js";
import { createNotification } from "./notification.controller.js";

// Mirrors the Navbar's "Free delivery over $75" banner — keep both this
// threshold/fee and the client-side estimate in Client/src/utils/shipping.js
// in sync if either changes.
const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
const FLAT_SHIPPING_FEE_CENTS = 599;

const calculateShippingFee = (subtotalCents) =>
  subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;

/**
 * Create a Stripe PaymentIntent for checkout
 * 
 * Flow:
 * 1. Validate cart exists and has items
 * 2. HARD stock check - ensure all items still in stock
 * 3. Fetch current product prices and validate items still exist
 * 4. Calculate total server-side (never trust client)
 * 5. Create Stripe PaymentIntent
 * 6. Return clientSecret to client
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return sendError(res, "Not authenticated", 401);
    }

    // Accept shippingAddress from client at checkout time
    const { shippingAddress } = req.body;
    if (!shippingAddress) {
      return sendError(res, "Shipping address is required", 400);
    }

    const { fullName, addressLine1, city, country, postalCode } = shippingAddress;
    if (!fullName || !addressLine1 || !city || !country || !postalCode) {
      return sendError(res, "Shipping address is missing required fields (fullName, addressLine1, city, country, postalCode)", 400);
    }

    // Step 1: Get user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return sendError(res, "Cart is empty", 400);
    }

    // Step 2: HARD stock check - ensure all items available
    const stockValidation = await validateCartStock(userId);
    if (!stockValidation.valid) {
      return sendError(res, stockValidation.message, 400);
    }

    // Step 3: Fetch current product details and validate
    let totalInCents = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);

      // Validate product still exists and is active
      if (!product || !product.isActive) {
        return sendError(res, "Product no longer available", 400);
      }

      // Validate price hasn't changed more than expected (5% tolerance)
      const priceDeviation = Math.abs(product.price - cartItem.priceAtAdd) / cartItem.priceAtAdd;
      if (priceDeviation > 0.05) {
        return sendError(
          res,
          `Price changed for ${product.name}. Please review your cart.`,
          400
        );
      }

      // Calculate item total
      const itemTotal = cartItem.priceAtAdd * cartItem.quantity;
      totalInCents += itemTotal;

      // Build order item snapshot
      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0] || { url: "", publicId: "" },
        priceAtPurchase: cartItem.priceAtAdd,
        quantity: cartItem.quantity,
      });
    }

    // Step 4: Validate total is reasonable (> 0, < 1 million cents = $10,000)
    if (totalInCents <= 0 || totalInCents > 1000000) {
      return sendError(res, "Invalid order total", 400);
    }

    // Step 5: Add shipping and create the Stripe PaymentIntent for the full
    // amount — the customer must be charged exactly what they're shown.
    const shippingFee = calculateShippingFee(totalInCents);
    const amountToCharge = totalInCents + shippingFee;

    // Store shippingAddress as JSON string in metadata so webhook can use it
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: "usd",
      metadata: {
        type: "checkout",
        userId: userId.toString(),
        cartSize: String(cart.items.length),
        shippingAddress: JSON.stringify(shippingAddress),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Snapshot exactly what this PaymentIntent was created to charge for.
    // verifyPayment (run by the webhook, possibly minutes later) builds the
    // Order from this snapshot — never from the live cart — so items the
    // user adds/changes after this point can't get bundled into an order
    // that was paid for something else. See PendingCheckout.js.
    await PendingCheckout.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        paymentIntentId: paymentIntent.id,
        userId,
        items: orderItems,
        subtotal: totalInCents,
        shippingFee,
        totalAmount: amountToCharge,
      },
      { upsert: true }
    );

    // Step 6: Return clientSecret to client
    return sendSuccess(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subtotal: totalInCents,
      shippingFee,
      totalAmount: amountToCharge,
      totalInDollars: (amountToCharge / 100).toFixed(2),
      itemCount: cart.items.length,
      orderItems, // For client-side preview
    });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    next(error);
  }
};

/**
 * Verify payment (called by webhook - Phase E)
 * Creates order after Stripe confirms payment
 */
export const verifyPayment = async (userId, paymentIntentId, shippingAddress) => {
  try {
    // Step 1: Fetch payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return {
        success: false,
        message: "Payment not successful",
      };
    }

    // Step 2: Check idempotency - order already created?
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder._id,
        message: "Order already created (idempotent)",
      };
    }

    // Step 3: Load the snapshot of exactly what this PaymentIntent was
    // created to charge for — NOT the user's live cart. The cart can change
    // (items added, quantities bumped) in the window between createPaymentIntent
    // and this webhook firing; building the order from the live cart would let
    // an order (and the stock/fulfillment that comes with it) diverge from
    // what Stripe actually charged. See PendingCheckout.js.
    const snapshot = await PendingCheckout.findOne({ paymentIntentId });
    if (!snapshot || snapshot.items.length === 0) {
      return {
        success: false,
        message: "No checkout snapshot found for this payment",
      };
    }

    // Defense in depth: both numbers are derived from the same computation
    // in createPaymentIntent, so they should always agree. A mismatch means
    // the PaymentIntent was altered out-of-band and must not proceed silently.
    if (paymentIntent.amount !== snapshot.totalAmount) {
      return {
        success: false,
        message: "Charged amount does not match the checkout snapshot",
      };
    }

    // Steps 4-7 run atomically: either the order + stock decrement + cart
    // update all land together, or none of them do. Stock is decremented with
    // a single conditional update per item (not read-then-write) so two
    // concurrent checkouts for the last unit can never both succeed.
    const session = await mongoose.startSession();
    let orderId;
    try {
      await session.withTransaction(async () => {
        const orderItems = snapshot.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          priceAtPurchase: item.priceAtPurchase,
          quantity: item.quantity,
        }));

        const [order] = await Order.create(
          [
            {
              userId,
              items: orderItems,
              shippingAddress,
              totalAmount: snapshot.totalAmount,
              shippingFee: snapshot.shippingFee,
              paymentIntentId,
              paymentStatus: "paid",
              status: "processing",
              statusHistory: [{ status: "processing", changedAt: new Date(), note: "Order placed" }],
            },
          ],
          { session }
        );

        for (const item of snapshot.items) {
          const decremented = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, soldCount: item.quantity } },
            { returnDocument: "after", session }
          );

          if (!decremented) {
            throw new Error(
              `Insufficient stock for product ${item.productId} — order cannot be completed`
            );
          }
        }

        // Only remove the quantities actually paid for. Anything the user
        // added to their cart (or bumped up) after this checkout started
        // stays in the cart instead of being silently discarded.
        const cart = await Cart.findOne({ userId }).session(session);
        if (cart) {
          const paidQtyByProduct = new Map(
            snapshot.items.map((i) => [i.productId.toString(), i.quantity])
          );
          cart.items = cart.items
            .map((cartItem) => ({
              productId: cartItem.productId,
              priceAtAdd: cartItem.priceAtAdd,
              quantity: cartItem.quantity - (paidQtyByProduct.get(cartItem.productId.toString()) || 0),
            }))
            .filter((item) => item.quantity > 0);
          await cart.save({ session });
        }

        orderId = order._id;
      });
    } finally {
      await session.endSession();
    }

    // Snapshot has served its purpose. TTL would eventually clean up an
    // unconsumed one (failed/abandoned checkout), but a successfully-consumed
    // one can go immediately.
    await PendingCheckout.deleteOne({ paymentIntentId });

    return {
      success: true,
      orderId,
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Verify Payment Error:", error);

    // A concurrent delivery of the same webhook event can lose a race on
    // Order.create's unique paymentIntentId index — that's not a real
    // failure, it means the OTHER call already created the order. Reporting
    // it as a failure would make the caller (handleCheckoutSucceeded) treat
    // a successfully-fulfilled order as failed payment and refund it.
    if (error.code === 11000 && error.keyPattern?.paymentIntentId) {
      const winningOrder = await Order.findOne({ paymentIntentId });
      if (winningOrder) {
        return {
          success: true,
          orderId: winningOrder._id,
          message: "Order already created by a concurrent request (idempotent)",
        };
      }
    }

    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get user's orders (paginated)
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return sendError(res, "Not authenticated", 401);
    }

    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Get orders and total count in parallel
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    next(error);
  }
};

/**
 * Get single order detail (user can only see their own)
 */
export const getOrderDetail = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
      return sendError(res, "Not authenticated", 401);
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    // Verify ownership (user can only see their own orders)
    if (order.userId.toString() !== userId.toString()) {
      return sendError(res, "Unauthorized - cannot view this order", 403);
    }

    return sendSuccess(res, { order });
  } catch (error) {
    console.error("Get Order Detail Error:", error);
    next(error);
  }
};

/**
 * Admin: Update order status
 * Statuses: pending, processing, shipped, delivered, cancelled
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, carrier, note } = req.body;

    if (!status) {
      return sendError(res, "Status is required", 400);
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    const previousStatus = order.status;
    if (previousStatus === status) {
      return sendSuccess(res, { order, message: `Order status is already ${status}` });
    }

    // A cancelled order has already been refunded via Stripe — the customer
    // has their money back. "Un-cancelling" it can't be a simple status flip:
    // there's no way to silently re-charge them, and leaving paymentStatus as
    // "refunded" while status moves on would let a second cancel attempt a
    // second refund on an already-fully-refunded charge (which Stripe rejects).
    // A genuine re-order requires a new payment, not a resurrected old one.
    if (previousStatus === "cancelled" && status !== "cancelled") {
      return sendError(
        res,
        "This order was already refunded and cannot be reactivated. The customer must place a new order.",
        400
      );
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (carrier !== undefined) order.carrier = carrier;

    const isCancelling = status === "cancelled" && previousStatus !== "cancelled";
    if (isCancelling) order.paymentStatus = "refunded";

    // Order save + stock restore are persisted BEFORE the Stripe refund call
    // (not after) — a transient DB failure here must never leave an order
    // that's about to be refunded still looking "paid/active" and eligible
    // to ship. If the refund call itself fails afterward, the order is
    // already safely marked cancelled/refunded in our own records (so it
    // can't be fulfilled or double-refunded), and that failure is reported
    // for manual follow-up rather than silently lost.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Reactivation (cancelled -> anything) is blocked above, so the only
        // stock adjustment possible here is a cancellation restoring stock —
        // purely additive, no race risk.
        if (status === "cancelled") {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: item.quantity, soldCount: -item.quantity } },
              { session }
            );
          }
        }

        order.status = status;
        order.statusHistory.push({ status, changedAt: new Date(), note: note || "" });
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    if (isCancelling) {
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: "requested_by_customer",
        });
      } catch (refundError) {
        console.error("Admin Stripe refund failed after order was marked cancelled:", refundError.message);
        return sendError(
          res,
          "Order was cancelled and stock restored, but the Stripe refund failed — please process it manually.",
          502
        );
      }
    }

    // Notify the order's user about the status change
    const statusLabels = {
      processing: "is being processed",
      shipped: "has been shipped",
      delivered: "has been delivered",
      cancelled: "has been cancelled",
    };
    if (statusLabels[status]) {
      await createNotification({
        userId: order.userId,
        type: "order_status_changed",
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} ${statusLabels[status]}.`,
        link: `/orders/${order._id}`,
      });
    }

    return sendSuccess(res, { order, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    next(error);
  }
};

/**
 * User: Cancel own order
 * Flow:
 * 1. Find order
 * 2. Check if owned by requesting user
 * 3. Verify status is 'pending' or 'processing'
 * 4. Update status to 'cancelled'
 * 5. Restore stock for all products
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
      return sendError(res, "Not authenticated", 401);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    // Verify ownership
    if (order.userId.toString() !== userId.toString()) {
      return sendError(res, "Unauthorized - cannot cancel this order", 403);
    }

    // Only allow cancelling if pending or processing
    if (order.status !== "processing" && order.status !== "pending") {
      return sendError(res, `Cannot cancel order in ${order.status} status`, 400);
    }

    order.status = "cancelled";
    order.paymentStatus = "refunded";
    order.statusHistory.push({ status: "cancelled", changedAt: new Date(), note: "Cancelled by customer" });

    // Persisted BEFORE the Stripe refund call — see the matching comment in
    // updateOrderStatus above for why this ordering matters.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await order.save({ session });
        // Restore stock (purely additive, no race risk)
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity, soldCount: -item.quantity } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    try {
      await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        reason: "requested_by_customer",
      });
    } catch (refundError) {
      console.error("Stripe refund failed after order was marked cancelled:", refundError.message);
      return sendError(
        res,
        "Your order was cancelled and stock restored, but the refund failed — please contact support.",
        502
      );
    }

    return sendSuccess(res, { order, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    next(error);
  }
};

/**
 * Admin: Get all orders with filtering and statistics
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, sortBy = "newest" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Build sort
    let sort = { createdAt: -1 };
    if (sortBy === "oldest") sort = { createdAt: 1 };
    else if (sortBy === "highest") sort = { totalAmount: -1 };
    else if (sortBy === "lowest") sort = { totalAmount: 1 };

    // Get orders + stats in parallel
    const [orders, totalOrders, revenueResult, statusBreakdown] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return sendSuccess(res, {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalOrders / limitNum),
        totalItems: totalOrders,
        itemsPerPage: limitNum,
      },
      statistics: {
        totalRevenue: revenueResult[0]?.total || 0,
        totalRevenueInDollars: ((revenueResult[0]?.total || 0) / 100).toFixed(2),
        totalOrders,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Get Admin Orders Error:", error);
    next(error);
  }
};

/**
 * Admin: Get bestseller products with sales statistics
 */
export const getBestsellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get top products by soldCount
    const bestsellers = await Product.find({ isActive: true })
      .select("name category price soldCount images brand compatiblePets")
      .sort({ soldCount: -1 })
      .limit(limit);

    // Calculate total sales info
    const totalStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$soldCount" },
          totalRevenue: { $sum: { $multiply: ["$price", "$soldCount"] } },
        },
      },
    ]);

    // Get category breakdown
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalSold: { $sum: "$soldCount" },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { totalSold: -1 } },
    ]);

    sendSuccess(res, {
      bestsellers: bestsellers.map((product) => ({
        ...product.toObject(),
        priceInDollars: (product.price / 100).toFixed(2),
      })),
      statistics: {
        totalSold: totalStats[0]?.totalSold || 0,
        totalRevenue: totalStats[0]?.totalRevenue || 0,
        totalRevenueInDollars: ((totalStats[0]?.totalRevenue || 0) / 100).toFixed(2),
        categoryStats,
      },
    });
  } catch (error) {
    console.error("Get Bestsellers Error:", error);
    next(error);
  }
};
