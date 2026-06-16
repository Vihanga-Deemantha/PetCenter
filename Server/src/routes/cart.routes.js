import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  bulkAddToCart,
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

// Bulk add multiple products to cart (Ecosystem Builder)
router.post("/bulk", bulkAddToCart);

export default router;
