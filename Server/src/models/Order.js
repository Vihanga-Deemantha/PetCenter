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
      description: "Total in cents (items + shippingFee). Calculated server-side, never from client.",
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, "Shipping fee cannot be negative"],
      description: "Cents. Included in totalAmount, broken out separately for display.",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "shipped", "delivered", "cancelled"],
        message: "Status must be one of: pending, processing, shipped, delivered, cancelled",
      },
      default: "processing",
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },
    carrier: {
      type: String,
      default: "",
      trim: true,
    },
    // A timestamped log of every status this order has been through — the
    // `status` field alone can only ever say what's true *right now*, so
    // without this a customer's timeline UI has no real dates to show.
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedAt: { type: Date, default: Date.now },
          note: { type: String, default: "" },
        },
      ],
      default: [],
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
        values: ["paid", "failed", "refund_pending", "refunded"],
        message: "Payment status must be one of: paid, failed, refund_pending, refunded",
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
