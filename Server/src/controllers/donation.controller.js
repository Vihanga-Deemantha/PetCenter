import stripe from "../config/stripe.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Create Payment Intent for Donation ───────────────────────────────────────
// POST /api/v1/donations/create-payment-intent — Public (optional authentication)
export const createDonationPaymentIntent = async (req, res, next) => {
  try {
    const { campaignId, amount, displayName, message } = req.body;

    if (!campaignId) {
      return sendError(res, "Campaign ID is required", 400);
    }

    if (!amount || parseInt(amount) < 50) {
      return sendError(res, "Donation amount must be at least 50 cents (0.50 USD)", 400);
    }

    const campaign = await Campaign.findOne({ _id: campaignId, deletedAt: null });
    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    if (campaign.status === "draft") {
      return sendError(res, "Cannot donate to a draft campaign", 400);
    }

    // Evaluate expiration
    const isExpired = campaign.deadline && new Date(campaign.deadline) < new Date();
    if (campaign.status === "expired" || isExpired) {
      return sendError(res, "Cannot donate to an expired campaign", 400);
    }

    if (campaign.status === "closed") {
      return sendError(res, "Cannot donate to a closed campaign", 400);
    }

    const userIdStr = req.user ? req.user._id.toString() : "";

    // Create the Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: "usd",
      metadata: {
        type: "donation",
        campaignId: campaignId.toString(),
        userId: userIdStr,
        displayName: displayName || "Anonymous",
        message: message || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create a pending donation in the database to log the intent
    await Donation.create({
      campaignId,
      userId: req.user ? req.user._id : null,
      displayName: displayName || "Anonymous",
      amount: parseInt(amount),
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      message: message || "",
    });

    return sendSuccess(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: parseInt(amount),
      campaignTitle: campaign.title,
    });
  } catch (error) {
    console.error("Donation PaymentIntent Error:", error);
    next(error);
  }
};

// ─── Get User's Donation History ──────────────────────────────────────────────
// GET /api/v1/donations/my-donations — Protected
export const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ userId: req.user._id, status: "completed" })
      .populate("campaignId", "title images category status raisedAmount goalAmount")
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, donations);
  } catch (error) {
    next(error);
  }
};

// ─── Get Admin Donation List (With User/Campaign Populate) ────────────────────
// GET /api/v1/admin/donations — Admin Only
export const getAdminDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find()
      .populate("campaignId", "title goalAmount raisedAmount")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, donations);
  } catch (error) {
    next(error);
  }
};
