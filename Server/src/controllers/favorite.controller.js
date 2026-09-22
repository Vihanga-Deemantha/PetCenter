import Favorite from "../models/Favorite.js";
import PetListing from "../models/PetListing.js";
import Product from "../models/Products.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { clampLimit } from "../utils/pagination.js";

// ─── Helper: verify the referenced item exists ────────────────────────────────
async function itemExists(itemType, itemId) {
  if (itemType === "listing") {
    return await PetListing.exists({ _id: itemId, status: { $ne: "removed" } });
  }
  if (itemType === "product") {
    return await Product.exists({ _id: itemId, isActive: true });
  }
  return false;
}

// ─── GET /favorites — Get user's favorites (paginated, filterable) ─────────────
export const getFavorites = async (req, res, next) => {
  try {
    const { itemType, page = 1 } = req.query;
    const limit = clampLimit(req.query.limit, { max: 100, fallback: 20 });
    const userId = req.user._id;

    const filter = { userId };
    if (itemType && ["listing", "product"].includes(itemType)) {
      filter.itemType = itemType;
    }

    const skip = (parseInt(page) - 1) * limit;

    const [favorites, total] = await Promise.all([
      Favorite.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Favorite.countDocuments(filter),
    ]);

    // Populate each favorite with its item details
    const populated = await Promise.all(
      favorites.map(async (fav) => {
        let item = null;
        if (fav.itemType === "listing") {
          item = await PetListing.findById(fav.itemId)
            .select("title petType breed price images status listingType location")
            .lean();
        } else if (fav.itemType === "product") {
          item = await Product.findById(fav.itemId)
            .select("name price images stock isActive averageRating reviewCount")
            .lean();
        }
        return { ...fav, item };
      })
    );

    return sendSuccess(res, populated, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /favorites — Add a favorite ─────────────────────────────────────────
export const addFavorite = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;
    const userId = req.user._id;

    if (!itemType || !["listing", "product"].includes(itemType)) {
      return sendError(res, "itemType must be 'listing' or 'product'", 400);
    }
    if (!itemId) {
      return sendError(res, "itemId is required", 400);
    }

    // Validate the referenced item exists
    const exists = await itemExists(itemType, itemId);
    if (!exists) {
      return sendError(res, "Item not found", 404);
    }

    const favorite = await Favorite.create({ userId, itemType, itemId });

    return sendSuccess(res, favorite, 201);
  } catch (error) {
    // Duplicate key = already favorited
    if (error.code === 11000) {
      return sendError(res, "Item is already in your favorites", 409);
    }
    next(error);
  }
};

// ─── DELETE /favorites/:itemType/:itemId — Remove a favorite (idempotent) ────
export const removeFavorite = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.user._id;

    await Favorite.findOneAndDelete({ userId, itemType, itemId });

    // Idempotent: return 200 even if it didn't exist
    return sendSuccess(res, { message: "Removed from favorites" });
  } catch (error) {
    next(error);
  }
};

// ─── GET /favorites/check — Batch check which items are favorited ─────────────
// Query: ?items=[{itemType,itemId},...]  or body with same shape
export const checkFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Support both query string (JSON encoded) and direct body array
    let items = [];
    if (req.query.items) {
      try {
        items = JSON.parse(req.query.items);
      } catch {
        return sendError(res, "Invalid items format — must be JSON array", 400);
      }
    } else if (req.body?.items) {
      items = req.body.items;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return sendSuccess(res, {});
    }

    // Bound the batch size — this becomes an $or clause below, and nothing
    // upstream limits how large a client-supplied array can be.
    items = items.slice(0, 200);

    // Items may come from a hand-parsed query-string JSON blob, which runs
    // after the app-wide sanitizer already executed — validate each entry's
    // shape here so a crafted itemType/itemId object can't smuggle Mongo
    // query operators (e.g. { "$ne": null }) into the filter below.
    items = items.filter(
      ({ itemType, itemId } = {}) =>
        typeof itemType === "string" &&
        ["listing", "product"].includes(itemType) &&
        typeof itemId === "string" &&
        /^[a-f0-9]{24}$/i.test(itemId)
    );

    if (items.length === 0) {
      return sendSuccess(res, {});
    }

    // Fetch all matching favorites in one query
    const orConditions = items.map(({ itemType, itemId }) => ({
      userId,
      itemType,
      itemId,
    }));

    const found = await Favorite.find({ $or: orConditions })
      .select("itemType itemId")
      .lean();

    // Build a Set of "itemType:itemId" for O(1) lookup
    const favSet = new Set(found.map((f) => `${f.itemType}:${f.itemId}`));

    // Return a map of itemId -> boolean
    const result = {};
    items.forEach(({ itemType, itemId }) => {
      result[itemId] = favSet.has(`${itemType}:${itemId}`);
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
