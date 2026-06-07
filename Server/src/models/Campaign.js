import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a campaign title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a campaign description"],
    },
    shortDescription: {
      type: String,
      required: [true, "Please add a short description"],
      maxlength: [200, "Short description cannot exceed 200 characters"],
      trim: true,
    },
    goalAmount: {
      type: Number,
      required: [true, "Please add a goal amount in cents"],
      min: [100, "Goal amount must be at least 100 cents (1 USD)"],
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    donorCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      validate: {
        validator: function (val) {
          return val.length >= 1 && val.length <= 6;
        },
        message: "Campaign must have between 1 and 6 images",
      },
    },
    category: {
      type: String,
      required: [true, "Please specify a campaign category"],
      enum: {
        values: ["medical", "shelter", "food", "rescue", "rehabilitation", "general"],
        message: "Invalid category choice",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "active", "goal_reached", "expired", "closed"],
        message: "Invalid campaign status",
      },
      default: "draft",
    },
    deadline: {
      type: Date,
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter",
    },
    featuredOrder: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closeReason: {
      type: String,
      required: [
        function () {
          return this.status === "closed";
        },
        "A reason is required to close a campaign",
      ],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignSchema.index({ title: "text", description: "text" });

// Sanitize HTML description on save/update
function sanitizeHtml(html) {
  if (!html) return html;
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^>\s]*)/gi, "");
}

campaignSchema.pre("save", function () {
  if (this.isModified("description")) {
    this.description = sanitizeHtml(this.description);
  }
});

// Delete Guard Pre-hooks
const verifyDeleteAllowed = async (campaign, DonationModel) => {
  if (campaign.status !== "draft") {
    throw new Error("Cannot delete a campaign that is not in draft status.");
  }
  const donationCount = await DonationModel.countDocuments({ campaignId: campaign._id });
  if (donationCount > 0) {
    throw new Error("Cannot delete a campaign with associated donations (even failed/refunded).");
  }
};

// Hook for doc.remove() / doc.deleteOne()
campaignSchema.pre("remove", async function () {
  const Donation = mongoose.model("Donation");
  await verifyDeleteAllowed(this, Donation);
});

campaignSchema.pre("deleteOne", { document: true, query: false }, async function () {
  const Donation = mongoose.model("Donation");
  await verifyDeleteAllowed(this, Donation);
});

// Hook for Query.deleteOne() / Query.findOneAndDelete() / Query.deleteMany()
campaignSchema.pre(["deleteOne", "findOneAndDelete", "deleteMany"], async function () {
  const query = this.getQuery();
  const campaigns = await this.model.find(query);
  const Donation = mongoose.model("Donation");

  for (const campaign of campaigns) {
    await verifyDeleteAllowed(campaign, Donation);
  }
});

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
