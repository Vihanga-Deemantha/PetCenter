import User from "../models/User.js";
import escapeRegExp from "../utils/escapeRegExp.js";
import PetListing from "../models/PetListing.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import EcosystemBuild from "../models/EcosystemBuild.js";
import Review from "../models/Review.js";
import Shelter from "../models/Shelter.js";
import PlatformFeedback from "../models/PlatformFeedback.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { createNotification } from "./notification.controller.js";

// ─── GET /admin/stats/public — Public platform stats ──────────────────────────
export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalListings,
      totalOrders,
      rescuedPets,
      globalPartners,
      ratingResult,
      recentUsersWithAvatars
    ] = await Promise.all([
      User.countDocuments({ role: "user", isDeleted: { $ne: true } }),
      PetListing.countDocuments({ status: "active" }),
      Order.countDocuments({ paymentStatus: "paid" }),
      PetListing.countDocuments({ status: { $in: ["adopted", "sold"] } }),
      Shelter.countDocuments({ isActive: true }),
      PlatformFeedback.aggregate([
        { $match: { isVisible: true } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
      User.find({ role: "user", profileImage: { $exists: true, $ne: "" }, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(4)
        .select("profileImage")
        .lean()
    ]);

    const averageRating = ratingResult[0]
      ? parseFloat(ratingResult[0].avg.toFixed(1))
      : null;
    const reviewCount = ratingResult[0]?.count ?? 0;
    
    // Extract array of avatar URLs
    const recentAvatars = recentUsersWithAvatars.map(u => u.profileImage);

    return sendSuccess(res, {
      totalUsers,
      totalListings,
      totalOrders,
      rescuedPets,
      globalPartners,
      happyFamilies: totalUsers, // Using total users for happy families stat
      averageRating,
      reviewCount,
      recentAvatars
    });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// GET /api/v1/admin/dashboard  — Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper to calculate trend percentage
    const calculateTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    // Helper for daily trends aggregation
    const getDailyTrendAgg = async (Model, matchQuery, dateField = "createdAt") => {
      return Model.aggregate([
        { $match: { ...matchQuery, [dateField]: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
            },
            count: { $sum: 1 },
            amount: { $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$amount", 0] }] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    };

    // Parallel execution of all stats metrics
    const [
      // Totals
      totalUsers,
      totalListings,
      totalProducts,
      totalOrders,
      totalCampaigns,
      totalDonations,

      // Current week counts (last 7 days)
      usersCurrentWeek,
      listingsCurrentWeek,
      productsCurrentWeek,
      ordersCurrentWeek,
      campaignsCurrentWeek,
      donationsCurrentWeek,

      // Previous week counts (day -14 to day -7)
      usersPreviousWeek,
      listingsPreviousWeek,
      productsPreviousWeek,
      ordersPreviousWeek,
      campaignsPreviousWeek,
      donationsPreviousWeek,

      // Revenues
      orderRevenueStats,
      donationRevenueStats,

      // 30-Day Aggregates
      dailyUserStats,
      dailyOrderStats,
      dailyDonationStats,

      // Activity Feed (Parallel retrieval)
      recentUsers,
      recentOrders,
      recentDonations,
    ] = await Promise.all([
      // Total counts
      User.countDocuments({ role: "user", isDeleted: { $ne: true } }),
      PetListing.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Campaign.countDocuments({ deletedAt: null }),
      Donation.countDocuments({ status: "completed" }),

      // Current week
      User.countDocuments({ role: "user", isDeleted: { $ne: true }, createdAt: { $gte: sevenDaysAgo } }),
      PetListing.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Product.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Campaign.countDocuments({ deletedAt: null, createdAt: { $gte: sevenDaysAgo } }),
      Donation.countDocuments({ status: "completed", createdAt: { $gte: sevenDaysAgo } }),

      // Previous week
      User.countDocuments({ role: "user", isDeleted: { $ne: true }, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      PetListing.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Product.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Campaign.countDocuments({ deletedAt: null, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Donation.countDocuments({ status: "completed", createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),

      // Order revenues aggregation
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            currentWeek: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, "$totalAmount", 0],
              },
            },
            previousWeek: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$createdAt", fourteenDaysAgo] },
                      { $lt: ["$createdAt", sevenDaysAgo] },
                    ],
                  },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Donation revenues aggregation
      Donation.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            currentWeek: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, "$amount", 0],
              },
            },
            previousWeek: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$createdAt", fourteenDaysAgo] },
                      { $lt: ["$createdAt", sevenDaysAgo] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Daily trends
      getDailyTrendAgg(User, { role: "user" }),
      getDailyTrendAgg(Order, { paymentStatus: "paid" }),
      getDailyTrendAgg(Donation, { status: "completed" }),

      // Activity Feed queries
      User.find({ role: "user", isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).lean(),
      Order.find().populate("userId", "name email").sort({ createdAt: -1 }).limit(5).lean(),
      Donation.find({ status: "completed" }).populate("campaignId", "title").sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Format revenues
    const totalOrderRevenue = orderRevenueStats[0]?.total || 0;
    const currentWeekOrderRev = orderRevenueStats[0]?.currentWeek || 0;
    const previousWeekOrderRev = orderRevenueStats[0]?.previousWeek || 0;

    const totalDonationRevenue = donationRevenueStats[0]?.total || 0;
    const currentWeekDonationRev = donationRevenueStats[0]?.currentWeek || 0;
    const previousWeekDonationRev = donationRevenueStats[0]?.previousWeek || 0;

    // Fill in 30 days gap for front-end charts
    const fill30Days = (dailyStats, type = "count") => {
      const data = [];
      const labels = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        labels.push(dateStr);

        const found = dailyStats.find((s) => s._id === dateStr);
        if (type === "count") {
          data.push(found ? found.count : 0);
        } else {
          // Convert cents to dollars for the charts
          data.push(found ? parseFloat((found.amount / 100).toFixed(2)) : 0);
        }
      }
      return { labels, data };
    };

    const userChart = fill30Days(dailyUserStats, "count");
    const orderChart = fill30Days(dailyOrderStats, "count");
    const donationChart = fill30Days(dailyDonationStats, "count");
    const orderRevenueChart = fill30Days(dailyOrderStats, "revenue");
    const donationRevenueChart = fill30Days(dailyDonationStats, "revenue");

    // Unified Chronological Activity Feed
    const activities = [];
    recentUsers.forEach((u) => {
      activities.push({
        id: `user-${u._id}`,
        type: "user_signup",
        title: "New User Registration",
        description: `${u.name} (${u.email}) joined the platform`,
        timestamp: u.createdAt,
      });
    });
    recentOrders.forEach((o) => {
      activities.push({
        id: `order-${o._id}`,
        type: "product_order",
        title: "Store Order Placed",
        description: `Order of $${(o.totalAmount / 100).toFixed(2)} placed by ${o.userId?.name || "Guest"}`,
        timestamp: o.createdAt,
      });
    });
    recentDonations.forEach((d) => {
      activities.push({
        id: `donation-${d._id}`,
        type: "campaign_donation",
        title: "Donation Received",
        description: `$${(d.amount / 100).toFixed(2)} contributed to "${d.campaignId?.title || "Campaign"}" by ${d.displayName}`,
        timestamp: d.createdAt,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const timeline = activities.slice(0, 10);

    // Fetch product metrics for breakdown
    const [lowStockProducts, outOfStockProducts, topProducts] = await Promise.all([
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.find({ isActive: true }).select("name category price soldCount images").sort({ soldCount: -1 }).limit(5).lean(),
    ]);

    // Send unified payload
    return sendSuccess(res, {
      cards: {
        users: {
          total: totalUsers,
          trend: calculateTrend(usersCurrentWeek, usersPreviousWeek),
        },
        listings: {
          total: totalListings,
          trend: calculateTrend(listingsCurrentWeek, listingsPreviousWeek),
        },
        products: {
          total: totalProducts,
          trend: calculateTrend(productsCurrentWeek, productsPreviousWeek),
        },
        orders: {
          total: totalOrders,
          trend: calculateTrend(ordersCurrentWeek, ordersPreviousWeek),
        },
        revenue: {
          totalInDollars: (totalOrderRevenue / 100).toFixed(2),
          trend: calculateTrend(currentWeekOrderRev, previousWeekOrderRev),
        },
        campaigns: {
          total: totalCampaigns,
          trend: calculateTrend(campaignsCurrentWeek, campaignsPreviousWeek),
        },
        donations: {
          total: totalDonations,
          trend: calculateTrend(donationsCurrentWeek, donationsPreviousWeek),
        },
        donationRevenue: {
          totalInDollars: (totalDonationRevenue / 100).toFixed(2),
          trend: calculateTrend(currentWeekDonationRev, previousWeekDonationRev),
        },
      },
      charts: {
        labels: userChart.labels, // same dates for all
        users: userChart.data,
        orders: orderChart.data,
        donations: donationChart.data,
        orderRevenue: orderRevenueChart.data,
        donationRevenue: donationRevenueChart.data,
      },
      productStats: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        topSelling: topProducts.map((p) => ({
          ...p,
          priceInDollars: (p.price / 100).toFixed(2),
        })),
      },
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Users ────────────────────────────────────────────────────────────
// GET /api/v1/admin/users  — Admin
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: "user", isDeleted: { $ne: true } };
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegExp(search), "i") },
        { email: new RegExp(escapeRegExp(search), "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, users, 200, {
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Block User ───────────────────────────────────────────────────────────────
// PUT /api/v1/admin/users/:id/block  — Admin
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "User not found", 404);
    if (user.role === "admin") return sendError(res, "Cannot block an admin", 400);

    user.isBlocked = true;
    user.refreshToken = undefined; // Invalidate sessions
    await user.save();

    return sendSuccess(res, { message: `${user.name} has been blocked` });
  } catch (error) {
    next(error);
  }
};

// ─── Unblock User ─────────────────────────────────────────────────────────────
// PUT /api/v1/admin/users/:id/unblock  — Admin
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "User not found", 404);

    user.isBlocked = false;
    await user.save();

    return sendSuccess(res, { message: `${user.name} has been unblocked` });
  } catch (error) {
    next(error);
  }
};

// ─── Delete User (Soft Delete) ────────────────────────────────────────────────
// DELETE /api/v1/admin/users/:id  — Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "User not found", 404);
    if (user.role === "admin") return sendError(res, "Cannot delete an admin", 400);

    user.isDeleted = true;
    user.refreshToken = undefined; // Invalidate sessions immediately
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate any still-valid access tokens
    await user.save();

    // Optionally set their listings to removed
    await PetListing.updateMany({ owner: user._id }, { status: "removed" });

    return sendSuccess(res, { message: `${user.name} has been deleted` });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Listings (all statuses) ─────────────────────────────────────────
// GET /api/v1/admin/listings  — Admin
export const getAllListings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: new RegExp(escapeRegExp(search), "i") },
        { breed: new RegExp(escapeRegExp(search), "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      PetListing.find(filter)
        .populate("owner", "name email")
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit)),
      PetListing.countDocuments(filter),
    ]);

    return sendSuccess(res, listings, 200, {
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Approve Listing ─────────────────────────────────────────────────────────
// PUT /api/v1/admin/listings/:id/approve  — Admin
export const approveListing = async (req, res, next) => {
  try {
    const listing = await PetListing.findById(req.params.id);
    if (!listing) return sendError(res, "Listing not found", 404);

    if (listing.status !== "pending") {
      return sendError(res, `Listing is already '${listing.status}'`, 400);
    }

    listing.status = "active";
    listing.moderationNote = "";
    await listing.save();

    // Notify listing owner
    await createNotification({
      userId: listing.owner,
      type: "listing_approved",
      title: "Your listing was approved!",
      message: `Your listing "${listing.title}" is now live on the marketplace.`,
      link: `/marketplace/${listing._id}`,
    });

    return sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};

// ─── Reject Listing ───────────────────────────────────────────────────────────
// PUT /api/v1/admin/listings/:id/reject  — Admin
export const rejectListing = async (req, res, next) => {
  try {
    const listing = await PetListing.findById(req.params.id);
    if (!listing) return sendError(res, "Listing not found", 404);

    if (listing.status !== "pending") {
      return sendError(res, `Listing is already '${listing.status}'`, 400);
    }

    listing.status = "removed";
    listing.moderationNote = req.body.note || "Rejected by admin";
    await listing.save();

    // Notify listing owner about rejection
    await createNotification({
      userId: listing.owner,
      type: "listing_rejected",
      title: "Your listing was not approved",
      message: `Your listing "${listing.title}" was rejected. Reason: ${req.body.note || "Community guidelines violation"}`,
      link: `/my-listings`,
    });

    return sendSuccess(res, { message: "Listing rejected", listing });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Listing (active → removed) ───────────────────────────────────────
// PUT /api/v1/admin/listings/:id/remove  — Admin
export const removeListing = async (req, res, next) => {
  try {
    const listing = await PetListing.findById(req.params.id);
    if (!listing) return sendError(res, "Listing not found", 404);

    listing.status = "removed";
    listing.moderationNote = req.body.note || "Removed by admin";
    await listing.save();

    // Notify listing owner
    await createNotification({
      userId: listing.owner,
      type: "listing_removed",
      title: "Your listing was removed",
      message: `Your listing "${listing.title}" has been removed. Reason: ${req.body.note || "Community guidelines violation"}`,
      link: `/my-listings`,
    });

    return sendSuccess(res, { message: "Listing removed", listing });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Published Ecosystem Builds (Admin) ────────────────────────────────
// GET /api/v1/admin/ecosystem/builds  — Admin only
export const getEcosystemBuilds = async (req, res, next) => {
  try {
    const builds = await EcosystemBuild
      .find({ isPublished: true })
      .populate("userId", "name email")
      .sort({ publishedAt: -1 })
      .lean();
    return sendSuccess(res, builds);
  } catch (error) {
    next(error);
  }
};

// ─── Force Unpublish an Ecosystem Build (Admin) ────────────────────────────────
// PATCH /api/v1/admin/ecosystem/builds/:id/unpublish  — Admin only
// Forces isPublished: false regardless of the owner — for guideline violations.
export const unpublishEcosystemBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const build = await EcosystemBuild.findById(id);
    if (!build) return sendError(res, "Build not found", 404);
    if (!build.isPublished) return sendError(res, "Build is not currently published", 400);

    build.isPublished = false;
    build.publishedAt = null;
    await build.save();

    return sendSuccess(res, { message: "Build unpublished successfully", build });
  } catch (error) {
    next(error);
  }
};

// End of admin ecosystem controller logic

