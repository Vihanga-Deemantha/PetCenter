import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Helper: recalculate product's averageRating and reviewCount ──────────────
async function recalculateProductRating(productId) {
  const [result] = await Review.aggregate([
    { $match: { productId, isVisible: true } },
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
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const filter = { productId, isVisible: true };

    let sortObj = { createdAt: -1 }; // newest first
    if (sort === "highest") sortObj = { rating: -1, createdAt: -1 };
    if (sort === "lowest") sortObj = { rating: 1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total, distribution] = await Promise.all([
      Review.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
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
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
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
    const { productId, rating, isVisible, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (productId) filter.productId = productId;
    if (rating) filter.rating = parseInt(rating);
    if (isVisible !== undefined) filter.isVisible = isVisible === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "name email profileImage")
        .populate("productId", "name images")
        .lean(),
      Review.countDocuments(filter),
    ]);

    return sendSuccess(res, reviews, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
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
      { new: true }
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
