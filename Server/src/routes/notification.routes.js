import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markOneRead);
router.delete("/:id", deleteNotification);

export default router;
