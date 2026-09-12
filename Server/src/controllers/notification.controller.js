import Notification from "../models/Notification.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Helper: create a notification (used by other controllers) ────────────────
export async function createNotification({ userId, type, title, message, link = "" }) {
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    // Never throw — notification failure must not break the triggering action
    console.error("[Notification] Failed to create notification:", err.message);
  }
}

// ─── GET /notifications — Protected, paginated, with unreadCount ──────────────
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return sendSuccess(res, notifications, 200, {
      unreadCount,
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

// ─── GET /notifications/unread-count — Lightweight unread count poll ──────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /notifications/:id/read — Mark one as read ────────────────────────
export const markOneRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { returnDocument: "after" }
    );

    if (!notification) return sendError(res, "Notification not found", 404);

    return sendSuccess(res, notification);
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /notifications/read-all — Mark all as read ────────────────────────
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return sendSuccess(res, { message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /notifications/:id — Delete one notification ─────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) return sendError(res, "Notification not found", 404);

    return sendSuccess(res, { message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};
