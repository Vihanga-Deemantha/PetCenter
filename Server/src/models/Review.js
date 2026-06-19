import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      default: "",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One review per product per order (prevents spam from repeat purchases)
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });
// For fast product reviews listing
reviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
