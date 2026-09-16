import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Get Public Campaigns (Filterable, Paginated) ─────────────────────────────
// GET /api/v1/campaigns — Public
export const getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 9, category, search, status } = req.query;

    const filter = { deletedAt: null, status: { $ne: "draft" } };

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaignsRaw, total] = await Promise.all([
      Campaign.find(filter)
        .populate("beneficiary", "name location logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    // On-the-fly evaluation of active campaigns that passed their deadline
    const now = new Date();
    const campaigns = campaignsRaw.map((camp) => {
      const isExpired = camp.deadline && new Date(camp.deadline) < now && camp.status === "active";
      return {
        ...camp,
        status: isExpired ? "expired" : camp.status,
      };
    });

    // In-memory sort to prioritize featuredOrder (null values last)
    campaigns.sort((a, b) => {
      const aFeatured = a.featuredOrder !== null && a.featuredOrder !== undefined;
      const bFeatured = b.featuredOrder !== null && b.featuredOrder !== undefined;
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      if (aFeatured && bFeatured) return a.featuredOrder - b.featuredOrder;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    return sendSuccess(res, campaigns, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Campaign Details + Last 10 Donors ────────────────────────────────────
// GET /api/v1/campaigns/:id — Public
export const getCampaignDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaignRaw = await Campaign.findOne({ _id: id, deletedAt: null })
      .populate("beneficiary")
      .lean();

    if (!campaignRaw) {
      return sendError(res, "Campaign not found", 404);
    }

    // Evaluate expired on-the-fly
    const isExpired = campaignRaw.deadline && new Date(campaignRaw.deadline) < new Date() && campaignRaw.status === "active";
    const campaign = {
      ...campaignRaw,
      status: isExpired ? "expired" : campaignRaw.status,
    };

    // Get last 10 completed donors
    const lastDonors = await Donation.find({ campaignId: id, status: "completed" })
      .select("displayName amount createdAt message")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return sendSuccess(res, {
      ...campaign,
      lastDonors,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Campaign Donors (Paginated) ──────────────────────────────────────────
// GET /api/v1/campaigns/:id/donors — Public
export const getCampaignDonors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { campaignId: id, status: "completed" };

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .select("displayName amount createdAt message")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Donation.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return sendSuccess(res, donations, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Admin Campaigns (Includes Drafts & Soft Deleted) ─────────────────
// GET /api/v1/admin/campaigns — Admin Only
export const getAdminCampaigns = async (req, res, next) => {
  try {
    const campaignsRaw = await Campaign.find({ deletedAt: null })
      .populate("beneficiary", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Same on-the-fly expiry evaluation as the public endpoints — without
    // it, the admin dashboard shows a stale "active" status for campaigns
    // that have actually passed their deadline.
    const now = new Date();
    const campaigns = campaignsRaw.map((camp) => {
      const isExpired = camp.deadline && new Date(camp.deadline) < now && camp.status === "active";
      return { ...camp, status: isExpired ? "expired" : camp.status };
    });

    return sendSuccess(res, campaigns);
  } catch (error) {
    next(error);
  }
};

// ─── Create Campaign (Admin Only) ──────────────────────────────────────────────
// POST /api/v1/admin/campaigns — Admin Only
export const createCampaign = async (req, res, next) => {
  try {
    const {
      title,
      description,
      shortDescription,
      goalAmount,
      category,
      deadline,
      beneficiary,
      featuredOrder,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return sendError(res, "At least one campaign image is required", 400);
    }

    if (req.files.length > 6) {
      return sendError(res, "Maximum 6 images allowed", 400);
    }

    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const campaignData = {
      title,
      description,
      shortDescription,
      goalAmount: parseInt(goalAmount),
      category,
      images,
      deadline: deadline || null,
      beneficiary: beneficiary || null,
      featuredOrder: featuredOrder !== undefined && featuredOrder !== "" ? parseInt(featuredOrder) : null,
      createdBy: req.user._id,
      status: "draft",
    };

    const campaign = await Campaign.create(campaignData);
    return sendSuccess(res, campaign, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Update Campaign (Admin Only) ──────────────────────────────────────────────
// PUT /api/v1/admin/campaigns/:id — Admin Only
export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      shortDescription,
      goalAmount,
      category,
      deadline,
      beneficiary,
      featuredOrder,
      removeImageIds,
    } = req.body;

    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    // Don't allow modification of certain properties once donations are made
    const donationCount = await Donation.countDocuments({ campaignId: id });
    if (donationCount > 0 && goalAmount && parseInt(goalAmount) !== campaign.goalAmount) {
      return sendError(res, "Cannot modify goal amount once donations have been received", 400);
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (shortDescription) campaign.shortDescription = shortDescription;
    if (category) campaign.category = category;
    if (deadline !== undefined) {
      const newDeadline = deadline ? new Date(deadline) : null;
      const oldTime = campaign.deadline ? campaign.deadline.getTime() : null;
      const newTime = newDeadline ? newDeadline.getTime() : null;
      // A changed deadline means the "closing soon" window has moved —
      // allow the scheduled check to notify again for the new date.
      if (oldTime !== newTime) {
        campaign.closingSoonNotified = false;
      }
      campaign.deadline = newDeadline;
    }
    if (beneficiary !== undefined) campaign.beneficiary = beneficiary || null;

    if (goalAmount) {
      campaign.goalAmount = parseInt(goalAmount);
    }

    if (featuredOrder !== undefined) {
      campaign.featuredOrder = featuredOrder !== null && featuredOrder !== "" ? parseInt(featuredOrder) : null;
    }

    // Handle image removal
    if (removeImageIds) {
      const idsToRemove = Array.isArray(removeImageIds) ? removeImageIds : [removeImageIds];
      campaign.images = campaign.images.filter((img) => !idsToRemove.includes(img.publicId));
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      campaign.images = [...campaign.images, ...newImages];

      if (campaign.images.length > 6) {
        return sendError(res, "Maximum 6 images allowed", 400);
      }
    }

    if (campaign.images.length === 0) {
      return sendError(res, "Campaign must have at least one image", 400);
    }

    await campaign.save();
    return sendSuccess(res, campaign);
  } catch (error) {
    next(error);
  }
};

// ─── Publish Campaign (Admin Only) ─────────────────────────────────────────────
// PATCH /api/v1/admin/campaigns/:id/publish — Admin Only
export const publishCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    if (campaign.status !== "draft") {
      return sendError(res, "Only draft campaigns can be published", 400);
    }

    campaign.status = "active";
    await campaign.save();

    return sendSuccess(res, campaign, 200, { message: "Campaign published successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Close Campaign (Admin Only) ────────────────────────────────────────────────
// PATCH /api/v1/admin/campaigns/:id/close — Admin Only
export const closeCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { closeReason } = req.body;

    if (!closeReason || closeReason.trim() === "") {
      return sendError(res, "Close reason is required", 400);
    }

    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    if (campaign.status === "draft") {
      return sendError(res, "Draft campaigns cannot be closed, delete them instead", 400);
    }

    campaign.status = "closed";
    campaign.closeReason = closeReason;
    await campaign.save();

    return sendSuccess(res, campaign, 200, { message: "Campaign closed successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Soft Delete Campaign (Admin Only) ─────────────────────────────────────────
// DELETE /api/v1/admin/campaigns/:id — Admin Only
export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });

    if (!campaign) {
      return sendError(res, "Campaign not found", 404);
    }

    // Trigger validation logic manually to return structured API response
    const donationCount = await Donation.countDocuments({ campaignId: id });

    if (campaign.status !== "draft") {
      return sendError(res, "Cannot delete a campaign that is not in draft status.", 400);
    }

    if (donationCount > 0) {
      return sendError(res, "Cannot delete a campaign with associated donations (even failed/refunded).", 400);
    }

    // Perform the soft delete
    campaign.deletedAt = new Date();
    await campaign.save();

    return sendSuccess(res, { message: "Campaign soft deleted successfully" });
  } catch (error) {
    next(error);
  }
};
