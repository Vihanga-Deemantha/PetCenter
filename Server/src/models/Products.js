import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a product name"],
            trim: true,
            maxlength: [100, "Product name cannot be more than 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Please add a product description"],
            maxlength: [2000, "Product description cannot be more than 2000 characters"],
        },
        price: {
            type: Number,
            required: [true, "Please add a product price"],
            min: [0, "Product price cannot be negative"],
        },
        images: {
            type: [String],
            default: [],
        },
        imagePublicIds: {
            type: [String],
            default: [],
        },
        stock: {
            type: Number,
            required: [true, "Please add product stock"],
            min: [0, "Product stock cannot be negative"],
        },
        category: {
            type: String,
            required: [true, "Please add a product category"],
            enum: ["dog", "cat", "bird", "fish", "reptile", "other"],
        },
        brand: {
            type: String,
            required: [true, "Please add a product brand"],
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);
export default Product;