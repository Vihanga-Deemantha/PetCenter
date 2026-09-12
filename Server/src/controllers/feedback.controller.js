import PlatformFeedback from "../models/PlatformFeedback.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { createNotification } from "./notification.controller.js";
import User from "../models/User.js";

// ─── POST /api/v1/feedback — Submit platform feedback (Protected) ────────────
export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Upsert feedback (one per user)
    const feedback = await PlatformFeedback.findOneAndUpdate(
      { userId },
      { userId, rating, comment },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    // Populate user for the response
    const populatedFeedback = await PlatformFeedback.findById(feedback._id).populate("userId", "name profileImage");

    // Optional: Notify admins if rating is 5 star (good) or 1 star (needs attention)
    if (rating === 5 || rating === 1) {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: "system",
          title: `New ${rating}-Star Platform Feedback`,
          message: `${req.user.name} left a ${rating}-star review: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
          link: "/admin",
        });
      }
    }

    return sendSuccess(res, {
      message: "Feedback submitted successfully",
      feedback: populatedFeedback,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/feedback/public — Get top feedback for homepage (Public) ────
export const getPublicFeedbacks = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const feedbacks = await PlatformFeedback.find({ isVisible: true, comment: { $ne: "" }, rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("userId", "name profileImage")
      .lean();

    return sendSuccess(res, feedbacks);
  } catch (error) {
    next(error);
  }
};
