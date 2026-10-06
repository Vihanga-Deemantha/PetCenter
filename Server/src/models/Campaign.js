import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import { CURRENCY_CODE } from "../config/currency.js";

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
      min: [100, `Goal amount must be at least 100 cents (1 ${CURRENCY_CODE})`],
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
    // Set once the scheduled closing-soon check has notified the creator, so
    // the same campaign doesn't get re-notified on every subsequent run.
    closingSoonNotified: {
      type: Boolean,
      default: false,
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

// Sanitize any HTML in admin-authored campaign copy against an explicit
// allow-list, rather than a regex blocklist that only catches known patterns
// (data: URIs, obfuscated handlers, etc. all slip past a blocklist).
const RICH_TEXT_SANITIZE_OPTIONS = {
  allowedTags: ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "a", "h3", "h4"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
  },
};

const PLAIN_TEXT_SANITIZE_OPTIONS = { allowedTags: [], allowedAttributes: {} };

campaignSchema.pre("save", function () {
  if (this.isModified("description")) {
    this.description = sanitizeHtml(this.description, RICH_TEXT_SANITIZE_OPTIONS);
  }
  if (this.isModified("title")) {
    this.title = sanitizeHtml(this.title, PLAIN_TEXT_SANITIZE_OPTIONS);
  }
  if (this.isModified("shortDescription")) {
    this.shortDescription = sanitizeHtml(this.shortDescription, PLAIN_TEXT_SANITIZE_OPTIONS);
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
