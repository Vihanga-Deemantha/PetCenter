import stripe from "../config/stripe.js";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { validateCartStock } from "./cart.controller.js";
import { createNotification } from "./notification.controller.js";

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

    // Step 5: Create Stripe PaymentIntent
    // Store shippingAddress as JSON string in metadata so webhook can use it
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        cartSize: String(cart.items.length),
        shippingAddress: JSON.stringify(shippingAddress),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Step 6: Return clientSecret to client
    return sendSuccess(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount: totalInCents,
      totalInDollars: (totalInCents / 100).toFixed(2),
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

    // Step 3: Get cart and validate stock one more time
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Cart empty or not found",
      };
    }

    const stockValidation = await validateCartStock(userId);
    if (!stockValidation.valid) {
      return {
        success: false,
        message: stockValidation.message,
      };
    }

    // Step 4: Build order with snapshots
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);
      if (!product || !product.isActive) {
        throw new Error("Product no longer available during order creation");
      }

      totalAmount += cartItem.priceAtAdd * cartItem.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0] || { url: "", publicId: "" },
        priceAtPurchase: cartItem.priceAtAdd,
        quantity: cartItem.quantity,
      });
    }

    // Step 5: Create order
    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentIntentId,
      paymentStatus: "paid",
      status: "processing",
    });

    await order.save();

    // Step 6: Decrement product stock
    for (const cartItem of cart.items) {
      const decrementResult = await Product.findByIdAndUpdate(
        cartItem.productId,
        {
          $inc: {
            stock: -cartItem.quantity,
            soldCount: cartItem.quantity,
          },
        },
        { new: true }
      );

      if (decrementResult.stock < 0) {
        throw new Error(
          `Stock went negative for product ${cartItem.productId} - rolling back`
        );
      }
    }

    // Step 7: Clear cart
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    return {
      success: true,
      orderId: order._id,
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Verify Payment Error:", error);
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
    const { status } = req.body;

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

    order.status = status;
    if (status === "cancelled") {
      order.paymentStatus = "refunded";
    }
    await order.save();

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

    // If changing to cancelled, restore stock
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        });
      }
    }
    // If changing FROM cancelled to something else, decrement stock back
    else if (previousStatus === "cancelled" && status !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stock: -item.quantity,
            soldCount: item.quantity,
          },
        });
      }
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
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity,
        },
      });
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
    const { limit = 10 } = req.query;

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
