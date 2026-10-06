import Product from "../models/Products.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { clampLimit, clampPage } from "../utils/pagination.js";

// ─── Get All Products (Paginated, Filterable, Searchable) ─────────────────────
// GET /api/v1/products  — Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      compatiblePets,
      tags,
      minPrice,
      maxPrice,
      inStock,
      search,
      sort = "newest",
    } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, { max: 60, fallback: 12 });

    const filter = { isActive: true };

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Compatible pets filter (can be array)
    if (compatiblePets) {
      const pets = Array.isArray(compatiblePets) ? compatiblePets : [compatiblePets];
      filter.compatiblePets = { $in: pets };
    }

    // Tags filter — used by the Ecosystem Builder to fetch products per category
    // e.g. ?tags=heater returns only products tagged with "heater"
    if (tags) {
      const tagsArr = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArr };
    }

    // Price range filter (convert to cents if needed)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // In stock filter
    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Text search (name, description, brand)
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting options
    let sortObj = { createdAt: -1 }; // default: newest
    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };
    if (sort === "bestseller") sortObj = { soldCount: -1 };

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(
      res,
      products,
      200,
      {
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Product Detail + Related Products ─────────────────────────────────────
// GET /api/v1/products/:id  — Public
export const getProductDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).lean();

    if (!product || !product.isActive) {
      return sendError(res, "Product not found", 404);
    }

    // Get 4 related products from same category
    const relatedProducts = await Product.find({
      category: product.category,
      isActive: true,
      _id: { $ne: product._id },
    })
      .limit(4)
      .lean();

    return sendSuccess(res, {
      ...product,
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Categories with Product Count ────────────────────────────────────────
// GET /api/v1/products/categories  — Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"];

    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat, isActive: true });
        return { name: cat, count };
      })
    );

    return sendSuccess(res, categoryData);
  } catch (error) {
    next(error);
  }
};

// ─── Create Product (Admin) ───────────────────────────────────────────────────
// POST /api/v1/products  — Admin
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      stock,
      brand,
      compatiblePets,
      tags,
    } = req.body;

    // Validate price is in cents (integer)
    if (!Number.isInteger(parseFloat(price))) {
      return sendError(res, "Price must be in cents as an integer (e.g., 1999 for $19.99)", 400);
    }

    // Validate images uploaded
    if (!req.files || req.files.length === 0) {
      return sendError(res, "At least one product image is required", 400);
    }

    if (req.files.length > 8) {
      return sendError(res, "Maximum 8 images allowed", 400);
    }

    // Validate compatiblePets is array with at least one value
    const petsArray = Array.isArray(compatiblePets)
      ? compatiblePets
      : [compatiblePets];
    if (!petsArray || petsArray.length === 0) {
      return sendError(res, "At least one compatible pet type is required", 400);
    }

    // Format images from multer upload
    const images = req.files.map((file) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
    }));

    // Parse stock and price as integers
    const productData = {
      name,
      description,
      category,
      price: parseInt(price),
      stock: parseInt(stock),
      brand: brand || "",
      compatiblePets: petsArray,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      images,
      isActive: true,
      soldCount: 0,
    };

    const product = await Product.create(productData);

    return sendSuccess(res, product, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Update Product (Admin) ───────────────────────────────────────────────────
// PUT /api/v1/products/:id  — Admin
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      stock,
      brand,
      compatiblePets,
      tags,
      removeImageIds,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) {
      if (!Number.isInteger(parseInt(price))) {
        return sendError(res, "Price must be in cents as an integer", 400);
      }
      product.price = parseInt(price);
    }
    if (stock !== undefined) product.stock = parseInt(stock);
    if (brand !== undefined) product.brand = brand;
    if (compatiblePets) {
      const petsArray = Array.isArray(compatiblePets)
        ? compatiblePets
        : [compatiblePets];
      if (petsArray.length === 0) {
        return sendError(res, "At least one compatible pet type is required", 400);
      }
      product.compatiblePets = petsArray;
    }
    if (tags !== undefined) {
      product.tags = Array.isArray(tags) ? tags : tags ? [tags] : [];
    }

    // Handle image removal
    if (removeImageIds) {
      const idsToRemove = Array.isArray(removeImageIds)
        ? removeImageIds
        : [removeImageIds];
      product.images = product.images.filter(
        (img) => !idsToRemove.includes(img.publicId)
      );
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      product.images = [...product.images, ...newImages];

      // Ensure max 8 images
      if (product.images.length > 8) {
        return sendError(res, "Maximum 8 images allowed", 400);
      }
    }

    // Ensure at least one image
    if (product.images.length === 0) {
      return sendError(res, "Product must have at least one image", 400);
    }

    await product.save();

    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

// ─── Update Stock (Admin) — Fast, Stock-Only Update ─────────────────────────────
// PATCH /api/v1/products/:id/stock  — Admin
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined) {
      return sendError(res, "Stock quantity is required", 400);
    }

    if (!Number.isInteger(parseInt(stock))) {
      return sendError(res, "Stock must be a whole number", 400);
    }

    const stockValue = parseInt(stock);

    if (stockValue < 0) {
      return sendError(res, "Stock cannot be negative", 400);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock: stockValue },
      { returnDocument: "after", runValidators: true }
    );

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

// ─── Soft Delete Product (Admin) ──────────────────────────────────────────────
// DELETE /api/v1/products/:id  — Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: "after" }
    );

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    return sendSuccess(res, { message: "Product soft deleted successfully", product });
  } catch (error) {
    next(error);
  }
};
