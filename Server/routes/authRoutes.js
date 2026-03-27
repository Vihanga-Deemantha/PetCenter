import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.put("/profile", protect, updateProfile);

export default router;
