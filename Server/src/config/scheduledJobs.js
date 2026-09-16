import cron from "node-cron";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import EcosystemBuild from "../models/EcosystemBuild.js";
import stripe from "./stripe.js";
import { createNotification } from "../controllers/notification.controller.js";
import { handleDonationSucceeded, handlePaymentIntentFailed } from "../controllers/webhook.controller.js";

const CLOSING_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

// Notifies a campaign's creator once it enters its final 48 hours, so an
// admin can decide whether to extend the deadline or let it close as-is.
// closingSoonNotified guards against re-notifying on every run.
export async function checkClosingCampaigns() {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + CLOSING_SOON_WINDOW_MS);

    const campaigns = await Campaign.find({
      status: "active",
      deletedAt: null,
      closingSoonNotified: false,
      deadline: { $ne: null, $gt: now, $lte: soon },
    });

    for (const campaign of campaigns) {
      await createNotification({
        userId: campaign.createdBy,
        type: "donation_campaign_closing",
        title: "Campaign closing soon",
        message: `"${campaign.title}" closes within 48 hours — raised $${(campaign.raisedAmount / 100).toFixed(2)} of its $${(campaign.goalAmount / 100).toFixed(2)} goal.`,
        link: `/campaigns/${campaign._id}`,
      });
      campaign.closingSoonNotified = true;
      await campaign.save();
    }

    if (campaigns.length > 0) {
      console.log(`[ScheduledJobs] Notified ${campaigns.length} closing-soon campaign(s)`);
    }
  } catch (err) {
    console.error("[ScheduledJobs] checkClosingCampaigns failed:", err.message);
  }
}

const PENDING_DONATION_GRACE_MS = 15 * 60 * 1000; // 15 minutes

// A donation is created as "pending" the moment a PaymentIntent is issued,
// before the user has even finished paying — normally the Stripe webhook
// flips it to "completed"/"failed" moments later. If that webhook delivery
// is ever missed (endpoint misconfigured, Stripe outage, server was down),
// nothing else in the app would ever notice or fix it, leaving a donor who
// successfully paid with a donation that looks stuck forever. This sweeps
// anything still "pending" past a grace period and asks Stripe directly.
export async function reconcilePendingDonations() {
  try {
    const cutoff = new Date(Date.now() - PENDING_DONATION_GRACE_MS);
    const stale = await Donation.find({ status: "pending", createdAt: { $lt: cutoff } });

    let reconciled = 0;
    for (const donation of stale) {
      try {
        const intent = await stripe.paymentIntents.retrieve(donation.stripePaymentIntentId);

        if (intent.status === "succeeded") {
          await handleDonationSucceeded(intent);
          reconciled++;
        } else if (["canceled", "requires_payment_method"].includes(intent.status)) {
          await handlePaymentIntentFailed(intent);
          reconciled++;
        }
        // Any other status (e.g. requires_action) is still genuinely in
        // progress — leave it as pending for the next sweep.
      } catch (err) {
        console.error(`[ScheduledJobs] Failed to reconcile donation ${donation._id}:`, err.message);
      }
    }

    if (reconciled > 0) {
      console.log(`[ScheduledJobs] Reconciled ${reconciled} stale pending donation(s)`);
    }
  } catch (err) {
    console.error("[ScheduledJobs] reconcilePendingDonations failed:", err.message);
  }
}

const STALE_DRAFT_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Empty, never-published ecosystem builds have no floor on creation (a user
// can save a draft with zero selections), so they'd otherwise accumulate
// forever with no cleanup path. Anything unpublished, empty, and untouched
// for 30+ days is safe to assume abandoned.
export async function cleanupStaleEcosystemDrafts() {
  try {
    const cutoff = new Date(Date.now() - STALE_DRAFT_AGE_MS);
    const result = await EcosystemBuild.deleteMany({
      isPublished: false,
      selections: { $size: 0 },
      updatedAt: { $lt: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`[ScheduledJobs] Deleted ${result.deletedCount} stale empty ecosystem draft(s)`);
    }
  } catch (err) {
    console.error("[ScheduledJobs] cleanupStaleEcosystemDrafts failed:", err.message);
  }
}

export function startScheduledJobs() {
  cron.schedule("0 */6 * * *", checkClosingCampaigns); // every 6 hours
  cron.schedule("*/15 * * * *", reconcilePendingDonations); // every 15 minutes
  cron.schedule("0 3 * * *", cleanupStaleEcosystemDrafts); // daily at 3am
}
