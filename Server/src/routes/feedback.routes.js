import express from "express";
import { submitFeedback, getPublicFeedbacks } from "../controllers/feedback.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public route
router.get("/public", getPublicFeedbacks);

// Protected routes
router.use(protect);
router.post("/", submitFeedback);

export default router;
