import mongoose from "mongoose";

const platformFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },
    isVisible: {
      type: Boolean,
      default: true, // Auto-visible by default, can be toggled by admin
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from leaving multiple platform feedbacks (they can only have one, and if they submit again it will update it)
// We will handle this in the controller (upsert or throw error) - let's enforce index
platformFeedbackSchema.index({ userId: 1 }, { unique: true });

const PlatformFeedback = mongoose.model("PlatformFeedback", platformFeedbackSchema);
export default PlatformFeedback;
