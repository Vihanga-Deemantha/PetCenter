import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { createNotification } from "./notification.controller.js";
import { clampLimit, clampPage } from "../utils/pagination.js";

// ─── Helper: recalculate product's averageRating and reviewCount ──────────────
async function recalculateProductRating(productId) {
  // $match in an aggregation pipeline never goes through Mongoose's schema
  // casting (unlike Model.find()), so a plain string productId — e.g. straight
  // from req.params — would match zero documents against the ObjectId-typed
  // field and silently zero out the product's rating. Cast explicitly.
  const [result] = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = result ? parseFloat(result.averageRating.toFixed(1)) : 0;
  const reviewCount = result ? result.reviewCount : 0;

  await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });
}

// ─── GET /products/:id/reviews — Public, paginated ────────────────────────────
export const getProductReviews = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { sort = "newest" } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit);

    const filter = { productId, isVisible: true };

    let sortObj = { createdAt: -1 }; // newest first
    if (sort === "highest") sortObj = { rating: -1, createdAt: -1 };
    if (sort === "lowest") sortObj = { rating: 1, createdAt: -1 };

    const skip = (page - 1) * limit;

    const [reviews, total, distribution] = await Promise.all([
      Review.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name profileImage")
        .lean(),
      Review.countDocuments(filter),
      // Rating distribution (1–5 star counts)
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), isVisible: true } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    // Format distribution as { 1: n, 2: n, ... 5: n }
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(({ _id, count }) => { dist[_id] = count; });

    return sendSuccess(res, reviews, 200, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      distribution: dist,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /products/:id/reviews — Protected, verified purchase ─────────────────
export const createReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment, orderId } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, "Rating must be between 1 and 5", 400);
    }

    // Verify the user has a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      _id: orderId,
      userId,
      status: "delivered",
      "items.productId": productId,
    });

    if (!deliveredOrder) {
      return sendError(
        res,
        "You can only review products you have purchased and received",
        403
      );
    }

    // Sanitize comment — strip HTML tags
    const sanitizedComment = comment
      ? comment.replace(/<[^>]*>/g, "").substring(0, 500)
      : "";

    const review = await Review.create({
      productId,
      userId,
      orderId,
      rating: parseInt(rating),
      comment: sanitizedComment,
    });

    // Recalculate product rating
    await recalculateProductRating(productId);

    // Products have no individual seller/owner to notify (unlike pet
    // listings), so a low rating — the kind that actually needs someone's
    // attention — goes to admins for moderation instead of nobody at all.
    if (review.rating <= 2) {
      const product = await Product.findById(productId).select("name").lean();
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: "review_received",
          title: `New ${review.rating}-Star Product Review`,
          message: `${req.user.name} left a ${review.rating}-star review on "${product?.name || "a product"}".`,
          link: "/admin/products",
        });
      }
    }

    const populated = await Review.findById(review._id)
      .populate("userId", "name profileImage")
      .lean();

    return sendSuccess(res, populated, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        "You have already reviewed this product for this order",
        409
      );
    }
    next(error);
  }
};

// ─── PUT /reviews/:id — Protected + ownerOnly, editable within 48h ───────────
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) return sendError(res, "Review not found", 404);
    if (review.userId.toString() !== userId.toString()) {
      return sendError(res, "Not authorized to edit this review", 403);
    }

    // Check 48-hour edit window
    const hoursSinceCreated = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 48) {
      return sendError(res, "Reviews can only be edited within 48 hours of posting", 403);
    }

    if (rating) review.rating = parseInt(rating);
    if (comment !== undefined) {
      review.comment = comment.replace(/<[^>]*>/g, "").substring(0, 500);
    }

    await review.save();
    await recalculateProductRating(review.productId);

    const populated = await Review.findById(review._id)
      .populate("userId", "name profileImage")
      .lean();

    return sendSuccess(res, populated);
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /reviews/:id — Protected + ownerOnly ──────────────────────────────
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) return sendError(res, "Review not found", 404);
    if (review.userId.toString() !== userId.toString()) {
      return sendError(res, "Not authorized to delete this review", 403);
    }

    // Same 48-hour window as editing (README-documented policy) — without
    // this, delete was silently unrestricted regardless of review age.
    const hoursSinceCreated = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 48) {
      return sendError(res, "Reviews can only be deleted within 48 hours of posting", 403);
    }

    const { productId } = review;
    await review.deleteOne();
    await recalculateProductRating(productId);

    return sendSuccess(res, { message: "Review deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── GET /admin/reviews — Admin: all reviews including hidden ─────────────────
export const adminGetReviews = async (req, res, next) => {
  try {
    const { productId, rating, isVisible } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, { max: 100, fallback: 20 });

    const filter = {};
    if (productId) filter.productId = productId;
    if (rating) filter.rating = parseInt(rating);
    if (isVisible !== undefined) filter.isVisible = isVisible === "true";

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email profileImage")
        .populate("productId", "name images")
        .lean(),
      Review.countDocuments(filter),
    ]);

    return sendSuccess(res, reviews, 200, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /admin/reviews/:id/hide — Admin: hide abusive review ───────────────
export const adminHideReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { isVisible: false },
      { returnDocument: "after" }
    );

    if (!review) return sendError(res, "Review not found", 404);

    // Recalculate product rating excluding hidden review
    await recalculateProductRating(review.productId);

    return sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

// ─── GET /products/:id/reviews/eligibility — Can user review? ────────────────
// Returns whether the user can write a review and which orderId to use
export const getReviewEligibility = async (req, res, next) => {
  try {
    if (!req.user) return sendSuccess(res, { canReview: false });

    const { id: productId } = req.params;
    const userId = req.user._id;

    // Check for delivered order with this product
    const deliveredOrder = await Order.findOne({
      userId,
      status: "delivered",
      "items.productId": productId,
    }).select("_id").lean();

    if (!deliveredOrder) {
      return sendSuccess(res, { canReview: false, reason: "no_purchase" });
    }

    // Check if they've already reviewed with this order
    const existingReview = await Review.findOne({
      userId,
      productId,
      orderId: deliveredOrder._id,
    }).lean();

    if (existingReview) {
      return sendSuccess(res, {
        canReview: false,
        reason: "already_reviewed",
        reviewId: existingReview._id,
        review: existingReview,
      });
    }

    return sendSuccess(res, {
      canReview: true,
      orderId: deliveredOrder._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /reviews/testimonials — Public: curated 5-star product reviews ────────
export const getPublicTestimonials = async (req, res, next) => {
  try {
    const limit = clampLimit(req.query.limit, { max: 20, fallback: 6 });

    const testimonials = await Review.find({ rating: 5, isVisible: true, comment: { $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name profileImage")
      .populate("productId", "name")
      .lean();

    return sendSuccess(res, testimonials);
  } catch (error) {
    next(error);
  }
};
