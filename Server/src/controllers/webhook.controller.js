import Order from "../models/Order.js";
import Product from "../models/Products.js";
import stripe from "../config/stripe.js";
import { verifyPayment } from "./order.controller.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * Handle Stripe webhook events
 * 
 * Events handled:
 * 1. payment_intent.succeeded — Create order + decrement stock
 * 2. charge.refunded — Mark order as refunded
 */
export const handleWebhookEvent = async (req, res, next) => {
  try {
    const event = req.stripeEvent;

    // Log webhook event for debugging
    console.log(`🔔 Webhook Event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge webhook receipt
    sendSuccess(res, { received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    // IMPORTANT: Still return 200 to prevent Stripe from retrying
    // (Stripe will retry on 5xx errors, causing duplicate processing)
    sendSuccess(res, { received: true });
  }
};

/**
 * Handle payment_intent.succeeded event
 * This is where orders are created and stock is decremented
 * CRITICAL: Must be atomic - if stock decrement fails, trigger refund
 */
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { id: paymentIntentId, metadata } = paymentIntent;
    const userId = metadata?.userId;

    if (!userId) {
      throw new Error("PaymentIntent missing userId metadata");
    }

    console.log(`💰 Payment succeeded for user ${userId}`);

    // Step 1: Check if order already exists (idempotency)
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
      console.log(`✅ Order already created (idempotent): ${existingOrder._id}`);
      return;
    }

    // Step 2: Parse shippingAddress from metadata (stored as JSON string)
    let shippingAddress;
    try {
      shippingAddress = metadata?.shippingAddress
        ? JSON.parse(metadata.shippingAddress)
        : null;
    } catch {
      throw new Error("Failed to parse shippingAddress from PaymentIntent metadata");
    }

    if (!shippingAddress) {
      throw new Error("PaymentIntent missing shippingAddress metadata");
    }

    // Step 3: Verify payment and create order
    const verificationResult = await verifyPayment(
      userId,
      paymentIntentId,
      shippingAddress
    );

    if (!verificationResult.success) {
      console.error(`❌ Payment verification failed: ${verificationResult.message}`);

      // Step 4: Refund payment if verification failed
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
        });
        console.log(`🔄 Refund triggered: ${refund.id}`);
      } catch (refundError) {
        console.error(`⚠️ Refund failed: ${refundError.message}`);
      }

      return;
    }

    console.log(`✅ Order created: ${verificationResult.orderId}`);
  } catch (error) {
    console.error(`❌ Payment succeeded handler error: ${error.message}`);
    // Don't throw — webhook must return 200 to Stripe
  }
}

/**
 * Handle charge.refunded event
 * Marks order as refunded when customer/admin initiates refund
 */
async function handleChargeRefunded(charge) {
  try {
    // ✅ FIXED: Stripe charge object has `payment_intent` (not `payment_intent_id`)
    const paymentIntentId = charge.payment_intent;

    if (!paymentIntentId) {
      console.warn("⚠️ Refunded charge missing paymentIntentId");
      return;
    }

    console.log(`🔄 Charge refunded: ${paymentIntentId}`);

    // Step 1: Find order by paymentIntentId
    const order = await Order.findOne({ paymentIntentId });

    if (!order) {
      console.warn(`⚠️ No order found for paymentIntentId: ${paymentIntentId}`);
      return;
    }

    // Step 2: Mark order as refunded and update payment status
    order.paymentStatus = "refunded";
    order.status = "cancelled";
    await order.save();

    console.log(`✅ Order marked as refunded: ${order._id}`);

    // Step 3: RESTORE stock (reverse the decrement)
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: item.quantity, // Add back to stock
            soldCount: -item.quantity, // Remove from sold count
          },
        },
        { new: true }
      );
    }

    console.log(`✅ Stock restored for order: ${order._id}`);
  } catch (error) {
    console.error(`❌ Charge refunded handler error: ${error.message}`);
  }
}
