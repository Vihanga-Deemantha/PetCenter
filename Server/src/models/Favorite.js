import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["listing", "product"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemTypeRef",
    },
  },
  { timestamps: true }
);

// Compound unique index — prevents duplicate favorites at DB level
favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
// Index for fast lookups
favoriteSchema.index({ userId: 1, itemType: 1 });

export default mongoose.model("Favorite", favoriteSchema);
