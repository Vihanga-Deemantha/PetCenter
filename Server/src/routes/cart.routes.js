import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get("/", getCart);

// Add item to cart (with soft stock check)
router.post("/items", addToCart);

// Update item quantity (0 to remove)
router.put("/items/:productId", updateCartItem);

// Remove item from cart
router.delete("/items/:productId", removeFromCart);

// Clear entire cart (called after checkout)
router.delete("/", clearCart);

export default router;
