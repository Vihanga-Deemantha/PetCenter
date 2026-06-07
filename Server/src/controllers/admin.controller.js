import User from "../models/User.js";
import PetListing from "../models/PetListing.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// GET /api/v1/admin/dashboard  — Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      totalListings,
      pendingListings,
      activeListings,
      soldListings,
      adoptedListings,
      removedListings,
      // Phase 2: Products
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      // Phase 2: Orders & Revenue
      totalOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ isBlocked: true }),
      PetListing.countDocuments(),
      PetListing.countDocuments({ status: "pending" }),
      PetListing.countDocuments({ status: "active" }),
      PetListing.countDocuments({ status: "sold" }),
      PetListing.countDocuments({ status: "adopted" }),
      PetListing.countDocuments({ status: "removed" }),
      // Products
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      // Orders
      Order.countDocuments(),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
    ]);

    // Revenue aggregation (total revenue from all paid orders)
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, monthlyRevenue: { $sum: "$totalAmount" } } },
    ]);

    // Top 5 bestselling products
    const topProducts = await Product.find({ isActive: true })
      .select("name category price soldCount images")
      .sort({ soldCount: -1 })
      .limit(5)
      .lean();

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.monthlyRevenue || 0;

    return sendSuccess(res, {
      users: { total: totalUsers, blocked: blockedUsers },
      listings: {
        total: totalListings,
        pending: pendingListings,
        active: activeListings,
        sold: soldListings,
        adopted: adoptedListings,
        removed: removedListings,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,   // stock 1-5
        outOfStock: outOfStockProducts, // stock 0
        topSelling: topProducts.map((p) => ({
          ...p,
          priceInDollars: (p.price / 100).toFixed(2),
        })),
      },
      orders: {
        total: totalOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        totalInCents: totalRevenue,
        totalInDollars: (totalRevenue / 100).toFixed(2),
        monthlyInCents: monthlyRevenue,
        monthlyInDollars: (monthlyRevenue / 100).toFixed(2),
      },
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
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
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
        { title: new RegExp(search, "i") },
        { breed: new RegExp(search, "i") },
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

    return sendSuccess(res, { message: "Listing removed", listing });
  } catch (error) {
    next(error);
  }
};
