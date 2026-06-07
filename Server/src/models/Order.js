import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          url: String,
          publicId: String,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
          description: "Price in cents at time of purchase. Snapshot to preserve order integrity.",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      description: "Total in cents. Calculated server-side, never from client.",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "shipped", "delivered", "cancelled"],
        message: "Status must be one of: pending, processing, shipped, delivered, cancelled",
      },
      default: "processing",
    },
    paymentIntentId: {
      type: String,
      required: [true, "Stripe Payment Intent ID is required"],
      unique: true,
      sparse: true,
      index: true,
      description: "Stripe Payment Intent ID for idempotency check on webhook.",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["paid", "failed", "refunded"],
        message: "Payment status must be one of: paid, failed, refunded",
      },
      default: "paid",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
orderSchema.index({ userId: 1, createdAt: -1 }); // For user order history

const Order = mongoose.model("Order", orderSchema);

export default Order;
