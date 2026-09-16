import mongoose from "mongoose";

const petListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    petType: {
      type: String,
      required: [true, "Please add a pet type"],
      enum: ["dog", "cat", "bird", "fish", "reptile", "other"],
    },
    breed: {
      type: String,
      required: [true, "Please add a breed"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Please add an age (in months)"],
      min: [0, "Age cannot be negative"],
    },
    gender: {
      type: String,
      required: [true, "Please specify gender"],
      enum: ["male", "female", "unknown"],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    location: {
      type: String,
      required: [true, "Please add a location"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    healthInfo: {
      type: String,
      required: [true, "Please add health/vaccination info"],
    },
    images: {
      type: [String],
      default: [],
    },
    imagePublicIds: {
      type: [String],
      default: [],
    },
    contactDetails: {
      type: String,
      required: [true, "Please add contact details"],
    },
    listingType: {
      type: String,
      required: [true, "Please specify listing type"],
      enum: ["sale", "adoption"],
    },
    // Status flow: pending → active → sold/adopted/removed. "paused" is an
    // owner-toggled state that hides an active listing from the marketplace
    // without going through re-moderation, exactly like pending/removed do.
    status: {
      type: String,
      enum: ["pending", "active", "paused", "sold", "adopted", "removed"],
      default: "pending",
    },
    verifiedFlags: {
      type: [String],
      enum: ["Vaccinated", "Spayed / Neutered", "Microchipped", "Habitat Included", "House-trained"],
      default: [],
    },
    enquiriesCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Admin moderation notes
    moderationNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
petListingSchema.index({ title: "text", breed: "text", description: "text" });
petListingSchema.index({ petType: 1, status: 1 });
petListingSchema.index({ owner: 1, status: 1 });

const PetListing = mongoose.model("PetListing", petListingSchema);
export default PetListing;
