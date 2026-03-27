import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: [
        "food",
        "habitat items",
        "accessories",
        "health care",
        "cleaning supplies",
        "toys",
        "cages",
        "tanks",
      ],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    stock: {
      type: Number,
      required: [true, "Please add stock quantity"],
      default: 0,
    },
    image: {
      type: String,
      default: "no-image.jpg",
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    brand: {
      type: String,
      required: [true, "Please add a brand"],
    },
    petCompatibility: {
      type: [String],
      default: ["all"],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
