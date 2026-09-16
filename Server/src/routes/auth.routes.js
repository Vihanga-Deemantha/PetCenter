import express from "express";
import {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  uploadProfilePhotoHandler,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { uploadProfilePhoto } from "../utils/uploadImage.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Public + rate limited
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.post("/refresh-token", authLimiter, refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:resetToken", authLimiter, resetPassword);

// Private
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/profile/photo", protect, uploadProfilePhoto, uploadProfilePhotoHandler);
router.put("/change-password", protect, changePassword);

export default router;
