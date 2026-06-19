import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
      index: "text",
    },
    description: {
      type: String,
      required: [true, "Please add a product description"],
      index: "text",
    },
    category: {
      type: String,
      enum: {
        values: ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"],
        message: "Category must be one of: food, habitat, accessories, healthcare, cleaning, toys",
      },
      required: [true, "Please select a category"],
    },
    price: {
      type: Number,
      required: [true, "Please add a product price in cents"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Price must be stored in cents as an integer (e.g., 1999 for $19.99)",
      },
    },
    stock: {
      type: Number,
      required: [true, "Please add stock quantity"],
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Stock must be a whole number",
      },
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      required: [true, "Please add at least one product image"],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 8;
        },
        message: "Product must have between 1 and 8 images",
      },
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    compatiblePets: {
      type: [
        {
          type: String,
          enum: {
            values: [
              "dog",
              "cat",
              "bird",
              "fish",
              "snake",
              "spider",
              "rabbit",
              "turtle",
              "mouse",
              "reptile",
              "amphibian",
              "universal",
            ],
            message:
              "Compatible pet must be one of: dog, cat, bird, fish, snake, spider, rabbit, turtle, mouse, reptile, amphibian, universal",
          },
        },
      ],
      required: [true, "Please specify at least one compatible pet type"],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: "Product must have at least one compatible pet type",
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: [0, "Sold count cannot be negative"],
    },
    // ── Phase 5: Reviews & Ratings ─────────────────────────────────────────
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search (name + description + brand)
productSchema.index({ name: "text", description: "text", brand: "text" });

// Indexes for filtering and sorting
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ compatiblePets: 1 });
productSchema.index({ soldCount: -1 }); // For bestseller sorting

const Product = mongoose.model("Product", productSchema);

export default Product;