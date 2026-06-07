import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Donation must be linked to a campaign"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Nullable for anonymous donations
    },
    displayName: {
      type: String,
      default: "Anonymous",
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Please specify the donation amount in cents"],
      min: [50, "Donation amount must be at least 50 cents (Stripe minimum)"],
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, "Stripe Payment Intent ID is required"],
      unique: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded"],
        message: "Invalid donation status",
      },
      default: "pending",
    },
    message: {
      type: String,
      maxlength: [300, "Donation message cannot exceed 300 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on stripePaymentIntentId is defined inline as unique: true above

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;
