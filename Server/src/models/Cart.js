import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cart must belong to a user"],
      unique: true,
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          validate: {
            validator: function (v) {
              return Number.isInteger(v);
            },
            message: "Quantity must be a whole number",
          },
        },
        priceAtAdd: {
          type: Number,
          required: [true, "Price snapshot at add time is required"],
          min: [0, "Price cannot be negative"],
          description:
            "Snapshot of product price when item was added to cart. Prevents price-change fraud at checkout.",
        },
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for cart item lookups
cartSchema.index({ userId: 1, "items.productId": 1 });

// TTL index: automatically delete carts untouched for 30+ days
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
