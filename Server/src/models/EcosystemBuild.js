import mongoose from "mongoose";
import { SUPPORTED_PET_TYPES } from "../config/petConfig.js";

// ─── Selection Sub-Schema ──────────────────────────────────────────────────────
// Each selection stores a snapshot of the product at save time so that if
// a product is later deleted or its price changes, the saved build still shows
// what was originally selected. Same principle as Order item snapshots in Phase 2.
const selectionSchema = new mongoose.Schema(
  {
    categoryKey: {
      type: String,
      required: [true, "Category key is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    productSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },  // cents, captured at save time
      image: { type: String, default: "" },      // first image URL
    },
  },
  { _id: false }
);

// ─── EcosystemBuild Schema ─────────────────────────────────────────────────────
const ecosystemBuildSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Build name is required"],
      trim: true,
      maxlength: [60, "Build name cannot exceed 60 characters"],
    },
    petType: {
      type: String,
      required: [true, "Pet type is required"],
      enum: {
        values: SUPPORTED_PET_TYPES,
        message: `Pet type must be one of: ${SUPPORTED_PET_TYPES.join(", ")}`,
      },
    },
    selections: {
      type: [selectionSchema],
      default: [],
    },
    // Total price stored at save time (in cents) — avoids recalculating on every read.
    // Used for display in the saved builds list and gallery.
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // Incremented atomically via $inc on every clone — used for "sort by most cloned"
    // and "N people built this" display in the gallery.
    cloneCount: {
      type: Number,
      default: 0,
      min: [0, "Clone count cannot be negative"],
    },
    // Optional reference to the source build when this build was cloned from the gallery.
    clonedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EcosystemBuild",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Gallery queries: published builds sorted by newest
ecosystemBuildSchema.index({ isPublished: 1, publishedAt: -1 });
// Gallery queries: published builds sorted by most cloned
ecosystemBuildSchema.index({ isPublished: 1, cloneCount: -1 });
// Per-user builds sorted by newest (My Builds page)
ecosystemBuildSchema.index({ userId: 1, createdAt: -1 });

const EcosystemBuild = mongoose.model("EcosystemBuild", ecosystemBuildSchema);
export default EcosystemBuild;
