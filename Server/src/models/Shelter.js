import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";

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
      email: {
        type: String,
        trim: true,
        lowercase: true,
        // Contact email is optional — only validate the format when one is
        // actually provided, so shelters without a public email still save.
        validate: {
          validator: (v) => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
          message: "Please add a valid email",
        },
      },
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

// Strip any HTML out of admin-authored plain-text fields — matches the
// Campaign model's approach so free-text fields can't carry markup/scripts
// even though the current UI only ever renders them as plain text.
const PLAIN_TEXT_SANITIZE_OPTIONS = { allowedTags: [], allowedAttributes: {} };

shelterSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.name = sanitizeHtml(this.name, PLAIN_TEXT_SANITIZE_OPTIONS);
  }
  if (this.isModified("description")) {
    this.description = sanitizeHtml(this.description, PLAIN_TEXT_SANITIZE_OPTIONS);
  }
  if (this.isModified("contact.website") && this.contact?.website) {
    this.contact.website = sanitizeHtml(this.contact.website, PLAIN_TEXT_SANITIZE_OPTIONS);
  }
});

// Indexes
shelterSchema.index({ name: "text", description: "text" });

const Shelter = mongoose.model("Shelter", shelterSchema);
export default Shelter;
