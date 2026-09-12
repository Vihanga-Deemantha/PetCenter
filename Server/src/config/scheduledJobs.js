import cron from "node-cron";
import Campaign from "../models/Campaign.js";
import { createNotification } from "../controllers/notification.controller.js";

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

// Runs every 6 hours — frequent enough to catch the 48h window reliably
// without hammering the database.
export function startScheduledJobs() {
  cron.schedule("0 */6 * * *", checkClosingCampaigns);
}
