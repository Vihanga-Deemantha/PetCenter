import mongoose from "mongoose";

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a shelter name"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Please add a shelter type"],
      enum: {
        values: ["shelter", "rescue", "rehabilitation", "vet_clinic", "foster_network"],
        message: "Invalid shelter type",
      },
    },
    description: {
      type: String,
      required: [true, "Please add a shelter description"],
      trim: true,
    },
    location: {
      city: {
        type: String,
        required: [true, "Please add the city name"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Please add the country name"],
        trim: true,
      },
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      website: { type: String, trim: true },
    },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
    needsList: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shelterSchema.index({ name: "text", description: "text" });

const Shelter = mongoose.model("Shelter", shelterSchema);
export default Shelter;
