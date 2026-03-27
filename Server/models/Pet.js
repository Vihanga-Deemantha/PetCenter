import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
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
    },
    age: {
      type: Number,
      required: [true, "Please add an age"],
    },
    gender: {
      type: String,
      required: [true, "Please add a gender"],
      enum: ["male", "female", "unknown"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
      default: 0,
    },
    location: {
      type: String,
      required: [true, "Please add a location"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    healthInfo: {
      type: String,
      required: [true, "Please add health/vaccination info"],
    },
    images: {
      type: [String],
      default: ["no-image.jpg"],
    },
    contactDetails: {
      type: String,
      required: [true, "Please add contact details"],
    },
    listingType: {
      type: String,
      required: [true, "Please add a listing type"],
      enum: ["sale", "adoption"],
    },
    status: {
      type: String,
      enum: ["active", "sold", "adopted", "removed"],
      default: "active",
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
