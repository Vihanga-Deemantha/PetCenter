import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Get User's Cart (with populated products) ────────────────────────────────
// GET /api/v1/cart  — Protected
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId }).lean();

    if (!cart) {
      // Return empty cart if not found
      return sendSuccess(res, {
        userId,
        items: [],
        itemCount: 0,
      });
    }

    // Populate product details for each item
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId)
          .select("name images stock isActive")
          .lean();

        if (!product || !product.isActive) {
          return null; // Skip inactive products
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          product: {
            name: product.name,
            image: product.images[0] || null, // First image
            stock: product.stock,
          },
        };
      })
    );

    // Filter out null items (removed/inactive products)
    const validItems = populatedItems.filter((item) => item !== null);

    // Calculate totals
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = validItems.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    return sendSuccess(res, {
      userId,
      items: validItems,
      itemCount,
      total, // in cents
      totalInDollars: (total / 100).toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add Item to Cart (with soft stock check) ─────────────────────────────────
// POST /api/v1/cart/items  — Protected
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity) {
      return sendError(res, "Product ID and quantity are required", 400);
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return sendError(res, "Quantity must be a positive integer", 400);
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return sendError(res, "Product not found or is inactive", 404);
    }

    // ─── SOFT STOCK CHECK ───────────────────────────────────────────────────
    // Check if product is in stock (soft check — just inform user)
    if (product.stock === 0) {
      return sendError(res, "Product is out of stock", 400);
    }

    // Check if requested quantity exceeds available stock (soft check)
    if (quantity > product.stock) {
      return sendError(
        res,
        `Only ${product.stock} units available in stock`,
        400
      );
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      // Increment quantity (with stock validation)
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return sendError(
          res,
          `Total quantity (${newQuantity}) exceeds available stock (${product.stock})`,
          400
        );
      }

      existingItem.quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        quantity,
        priceAtAdd: product.price, // Snapshot price at add time
      });
    }

    // Update timestamp
    cart.updatedAt = new Date();

    await cart.save();

    // Return updated cart with populated items
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const p = await Product.findById(item.productId)
          .select("name images stock")
          .lean();

        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          product: {
            name: p.name,
            image: p.images[0] || null,
            stock: p.stock,
          },
        };
      })
    );

    const itemCount = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    return sendSuccess(
      res,
      {
        items: populatedItems,
        itemCount,
        message: "Item added to cart successfully",
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─── Update Cart Item Quantity ────────────────────────────────────────────────
// PUT /api/v1/cart/items/:productId  — Protected
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (quantity === undefined) {
      return sendError(res, "Quantity is required", 400);
    }

    if (!Number.isInteger(quantity)) {
      return sendError(res, "Quantity must be an integer", 400);
    }

    // If quantity is 0, remove item from cart
    if (quantity === 0) {
      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return sendError(res, "Cart not found", 404);
      }

      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
      cart.updatedAt = new Date();
      await cart.save();

      return sendSuccess(res, {
        message: "Item removed from cart",
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    if (quantity < 1) {
      return sendError(res, "Quantity must be at least 1 or 0 to remove", 400);
    }

    // Get product to check stock
    const product = await Product.findById(productId);

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    // Validate quantity against stock
    if (quantity > product.stock) {
      return sendError(
        res,
        `Requested quantity (${quantity}) exceeds available stock (${product.stock})`,
        400
      );
    }

    // Find and update cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return sendError(res, "Cart not found", 404);
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return sendError(res, "Product not in cart", 404);
    }

    item.quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();

    // Return updated cart
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const p = await Product.findById(item.productId)
          .select("name images stock")
          .lean();

        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          product: {
            name: p.name,
            image: p.images[0] || null,
            stock: p.stock,
          },
        };
      })
    );

    const itemCount = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    return sendSuccess(res, {
      items: populatedItems,
      itemCount,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Single Item from Cart ─────────────────────────────────────────────
// DELETE /api/v1/cart/items/:productId  — Protected
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return sendError(res, "Cart not found", 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return sendError(res, "Product not in cart", 404);
    }

    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date();
    await cart.save();

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return sendSuccess(res, {
      message: "Item removed from cart",
      itemCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Clear Entire Cart ────────────────────────────────────────────────────────
// DELETE /api/v1/cart  — Protected
// Called internally after successful checkout or by user
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return sendError(res, "Cart not found", 404);
    }

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    return sendSuccess(res, {
      message: "Cart cleared successfully",
      itemCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Internal: Hard Stock Check (used by checkout) ───────────────────────────
// Helper function called during checkout (Phase D)
export const validateCartStock = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return { valid: false, message: "Cart is empty" };
    }

    // Check stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return {
          valid: false,
          message: `Product "${item.productId}" is no longer available`,
        };
      }

      if (product.stock === 0) {
        return {
          valid: false,
          message: `${product.name} is out of stock`,
        };
      }

      if (item.quantity > product.stock) {
        return {
          valid: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, message: "Error validating cart stock", error };
  }
};

// ─── Bulk Add to Cart (Ecosystem Builder) ─────────────────────────────────────
// POST /api/v1/cart/bulk  — Protected
// Accepts an array of { productId, quantity } and adds each to the user's cart
// with individual stock checks. Returns { added, failed, itemCount } so the
// frontend can report partial success clearly rather than treating it as a
// total failure.
export const bulkAddToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, "items must be a non-empty array", 400);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const added = [];
    const failed = [];

    for (const entry of items) {
      const { productId, quantity = 1 } = entry;

      if (!productId) {
        failed.push({ productId, reason: "Missing productId" });
        continue;
      }

      // A negative/zero/non-integer quantity here would otherwise reach
      // cart.save() and fail the schema's own validators — but since every
      // entry in this batch shares one Cart document, that single failed
      // save throws and discards every other, legitimately-added item in
      // the same request, not just this bad entry.
      if (!Number.isInteger(quantity) || quantity < 1) {
        failed.push({ productId, reason: "Quantity must be a positive whole number" });
        continue;
      }

      const product = await Product.findById(productId);

      if (!product || !product.isActive) {
        failed.push({ productId, reason: "Product not found or inactive" });
        continue;
      }

      if (product.stock === 0) {
        failed.push({ productId, name: product.name, reason: "Out of stock" });
        continue;
      }

      const existing = cart.items.find(
        (i) => i.productId.toString() === productId.toString()
      );

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          // Add as many as available
          existing.quantity = product.stock;
          added.push({ productId, name: product.name, note: `Quantity capped at available stock (${product.stock})` });
        } else {
          existing.quantity = newQty;
          added.push({ productId, name: product.name });
        }
      } else {
        const safeQty = Math.min(quantity, product.stock);
        cart.items.push({
          productId,
          quantity: safeQty,
          priceAtAdd: product.price,
        });
        added.push({ productId, name: product.name });
      }
    }

    cart.updatedAt = new Date();
    await cart.save();

    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    return sendSuccess(res, { added, failed, itemCount });
  } catch (error) {
    next(error);
  }
};
