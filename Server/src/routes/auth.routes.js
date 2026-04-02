import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  uploadProfilePhotoHandler,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { uploadProfilePhoto } from "../utils/uploadImage.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Public + rate limited
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);

// Private
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/profile/photo", protect, uploadProfilePhoto, uploadProfilePhotoHandler);

export default router;
