import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import stripe from "../config/stripe.js";
import { verifyPayment } from "./order.controller.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Handle Stripe Webhook Events ─────────────────────────────────────────────
// POST /api/v1/webhooks/stripe
export const handleWebhookEvent = async (req, res, next) => {
  try {
    const event = req.stripeEvent;
    if (!event) {
      return sendError(res, "Stripe event not attached. Signature check failed.", 401);
    }

    console.log(`🔔 Webhook Event Received: ${event.type}`);

    // Route event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        const metadata = paymentIntent.metadata || {};
        const type = metadata.type;

        // 1. Idempotency Check (Second step)
        const [existingOrder, existingDonation] = await Promise.all([
          Order.findOne({ paymentIntentId }),
          Donation.findOne({ stripePaymentIntentId: paymentIntentId, status: "completed" }),
        ]);

        if (existingOrder || existingDonation) {
          console.log(`✅ Idempotency: Event ${paymentIntentId} already processed.`);
          return sendSuccess(res, { received: true, duplicate: true });
        }

        // 2. Metadata Routing (Third step)
        if (!type) {
          console.error(`🚨 Webhook Error: Missing metadata.type for intent ${paymentIntentId}`);
          return sendError(res, "Missing metadata.type in Stripe PaymentIntent", 400);
        }

        if (type === "checkout") {
          await handleCheckoutSucceeded(paymentIntent);
        } else if (type === "donation") {
          await handleDonationSucceeded(paymentIntent);
        } else {
          // 3. Default branch - unrecognized metadata.type
          console.error(`🚨 Webhook Alert: Unrecognized metadata.type '${type}' for intent ${paymentIntentId}`);
          return sendError(res, `Unrecognized metadata.type '${type}'`, 400);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return sendSuccess(res, { received: true });
  } catch (error) {
    console.error("🚨 Webhook Handler Error:", error);
    // Return 500 only if signature succeeded but internal code crashed, Stripe will retry
    next(error);
  }
};

// ─── Process Checkout Order ──────────────────────────────────────────────────
async function handleCheckoutSucceeded(paymentIntent) {
  const { id: paymentIntentId, metadata } = paymentIntent;
  const userId = metadata?.userId;

  if (!userId) {
    throw new Error("Checkout PaymentIntent missing userId metadata");
  }

  // Parse shippingAddress from metadata (stored as JSON string)
  let shippingAddress;
  try {
    shippingAddress = metadata?.shippingAddress ? JSON.parse(metadata.shippingAddress) : null;
  } catch {
    throw new Error("Failed to parse shippingAddress from PaymentIntent metadata");
  }

  if (!shippingAddress) {
    throw new Error("PaymentIntent missing shippingAddress metadata");
  }

  // Verify payment and create order
  const verificationResult = await verifyPayment(userId, paymentIntentId, shippingAddress);

  if (!verificationResult.success) {
    console.error(`❌ Payment verification failed: ${verificationResult.message}`);

    // Refund checkout if verification failed
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      });
      console.log(`🔄 Checkout refund triggered: ${refund.id}`);
    } catch (refundError) {
      console.error(`⚠️ Checkout refund failed: ${refundError.message}`);
    }
    return;
  }

  console.log(`✅ Order created successfully: ${verificationResult.orderId}`);
}

// ─── Process Campaign Donation ───────────────────────────────────────────────
async function handleDonationSucceeded(paymentIntent) {
  const { id: paymentIntentId, amount, metadata } = paymentIntent;
  const { campaignId, userId, displayName, message } = metadata;

  if (!campaignId) {
    throw new Error("Donation PaymentIntent missing campaignId metadata");
  }

  console.log(`💰 Processing donation of $${(amount / 100).toFixed(2)} for campaign ${campaignId}`);

  // Find or create pending/completed donation record
  let donation = await Donation.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!donation) {
    donation = new Donation({
      campaignId,
      userId: userId || null,
      displayName: displayName || "Anonymous",
      amount,
      stripePaymentIntentId: paymentIntentId,
      message: message || "",
    });
  }

  donation.status = "completed";
  await donation.save();

  // Atomically update Campaign goal progress
  const campaign = await Campaign.findOne({ _id: campaignId, deletedAt: null });
  if (!campaign) {
    console.warn(`🚨 Campaign ${campaignId} not found or soft deleted during donation completion`);
    return;
  }

  campaign.raisedAmount += amount;
  campaign.donorCount += 1;

  // Mark goal reached if raised amount meets or exceeds target
  if (campaign.raisedAmount >= campaign.goalAmount && campaign.status === "active") {
    campaign.status = "goal_reached";
  }

  await campaign.save();
  console.log(`✅ Campaign ${campaignId} updated with donation. Raised: $${(campaign.raisedAmount / 100).toFixed(2)}`);
}

// ─── Process Refunds ─────────────────────────────────────────────────────────
async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.warn("⚠️ Refunded charge missing paymentIntentId");
    return;
  }

  console.log(`🔄 Charge refunded for payment intent: ${paymentIntentId}`);

  // 1. Try to find and refund an Order
  const order = await Order.findOne({ paymentIntentId });
  if (order) {
    if (order.paymentStatus === "refunded") return; // Already processed

    order.paymentStatus = "refunded";
    order.status = "cancelled";
    await order.save();

    console.log(`✅ Order ${order._id} marked as refunded`);

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        },
        { new: true }
      );
    }
    console.log(`✅ Stock restored for refunded order: ${order._id}`);
    return;
  }

  // 2. Try to find and refund a Donation
  const donation = await Donation.findOne({ stripePaymentIntentId: paymentIntentId });
  if (donation) {
    if (donation.status === "refunded") return; // Already processed

    donation.status = "refunded";
    await donation.save();

    console.log(`✅ Donation ${donation._id} marked as refunded`);

    // Reverse campaign contributions
    const campaign = await Campaign.findOne({ _id: donation.campaignId, deletedAt: null });
    if (campaign) {
      campaign.raisedAmount = Math.max(0, campaign.raisedAmount - donation.amount);
      campaign.donorCount = Math.max(0, campaign.donorCount - 1);

      // Re-open campaign if it was goal_reached but falls below target
      if (campaign.status === "goal_reached" && campaign.raisedAmount < campaign.goalAmount) {
        campaign.status = "active";
      }

      await campaign.save();
      console.log(`✅ Campaign ${campaign._id} updated after refund. Raised: $${(campaign.raisedAmount / 100).toFixed(2)}`);
    }
  }
}
