import PetListing from "../models/PetListing.js";
import cloudinary from "../config/cloudinary.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import escapeRegExp from "../utils/escapeRegExp.js";

// ─── Get All Active Listings (public) ─────────────────────────────────────────
// GET /api/v1/listings
export const getListings = async (req, res, next) => {
  try {
    const {
      petType,
      listingType,
      location,
      search,
      minPrice,
      maxPrice,
      gender,
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { status: "active" };

    if (petType) filter.petType = petType;
    if (listingType) filter.listingType = listingType;
    if (gender) filter.gender = gender;
    if (location) filter.location = new RegExp(escapeRegExp(location), "i");

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), "i");
      filter.$or = [
        { title: searchRegex },
        { breed: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      PetListing.find(filter)
        .populate("owner", "name profileImage location")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      PetListing.countDocuments(filter),
    ]);

    return sendSuccess(res, listings, 200, {
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Listing ────────────────────────────────────────────────────────
// GET /api/v1/listings/:id
export const getListing = async (req, res, next) => {
  try {
    // contactDetails (and the owner's account email/phone) are intentionally
    // excluded here — they're only served, authenticated, via
    // revealListingContact below. Otherwise the "sign in to reveal contact"
    // UI is purely cosmetic since the real values would already be sitting
    // in this response's network payload.
    const listing = await PetListing.findById(req.params.id)
      .select("-contactDetails")
      .populate("owner", "name location profileImage createdAt");

    if (!listing || listing.status === "removed") {
      return sendError(res, "Listing not found", 404);
    }

    // Atomically increment views without awaiting the full save latency,
    // or just trigger an update. Fast and efficient.
    await PetListing.updateOne({ _id: listing._id }, { $inc: { viewCount: 1 } });
    listing.viewCount = (listing.viewCount || 0) + 1; // Update locally for this response

    return sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};

// ─── Reveal Listing Contact Details (auth required) ────────────────────────────
// POST /api/v1/listings/:id/reveal-contact — Private
export const revealListingContact = async (req, res, next) => {
  try {
    const listing = await PetListing.findById(req.params.id)
      .select("contactDetails status")
      .populate("owner", "phone");

    if (!listing || listing.status === "removed") {
      return sendError(res, "Listing not found", 404);
    }

    return sendSuccess(res, {
      contactDetails: listing.contactDetails,
      ownerPhone: listing.owner?.phone || null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create Listing ────────────────────────────────────────────────────────────
// POST /api/v1/listings  — Private
export const createListing = async (req, res, next) => {
  try {
    const {
      title, petType, breed, age, gender, price,
      location, description, healthInfo, contactDetails, listingType,
    } = req.body;

    // Cloudinary: files uploaded by multer middleware
    const images = req.files?.map((f) => f.path) || [];
    const imagePublicIds = req.files?.map((f) => f.filename) || [];

    const listing = await PetListing.create({
      title, petType, breed,
      age: Number(age),
      gender,
      price: Number(price) || 0,
      location, description, healthInfo, contactDetails, listingType,
      images,
      imagePublicIds,
      owner: req.user._id,
      status: "pending", // must be approved by admin
    });

    return sendSuccess(res, listing, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Update Listing ────────────────────────────────────────────────────────────
// PUT /api/v1/listings/:id  — Private (owner only)
export const updateListing = async (req, res, next) => {
  try {
    let listing = await PetListing.findById(req.params.id);

    if (!listing) {
      return sendError(res, "Listing not found", 404);
    }

    // Only the owner can update
    if (listing.owner.toString() !== req.user._id.toString()) {
      return sendError(res, "Not authorized to update this listing", 403);
    }

    // Disallow updating removed listings
    if (listing.status === "removed") {
      return sendError(res, "Cannot update a removed listing", 400);
    }

    const allowedUpdates = [
      "title", "breed", "age", "gender", "price",
      "location", "description", "healthInfo", "contactDetails", "listingType",
    ];
    const updates = {};
    allowedUpdates.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Start from the current image arrays; apply removals, then appends
    let images = [...listing.images];
    let imagePublicIds = [...listing.imagePublicIds];

    if (req.body.removeImageIds) {
      const idsToRemove = Array.isArray(req.body.removeImageIds)
        ? req.body.removeImageIds
        : [req.body.removeImageIds];

      const keptIndexes = imagePublicIds
        .map((publicId, i) => ({ publicId, i }))
        .filter(({ publicId }) => !idsToRemove.includes(publicId));

      images = keptIndexes.map(({ i }) => images[i]);
      imagePublicIds = keptIndexes.map(({ publicId }) => publicId);

      for (const publicId of idsToRemove) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete Cloudinary image ${publicId}:`, err.message);
        }
      }
    }

    // If new images were uploaded, append them
    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map((f) => f.path)];
      imagePublicIds = [...imagePublicIds, ...req.files.map((f) => f.filename)];
    }

    if (req.body.removeImageIds || (req.files && req.files.length > 0)) {
      updates.images = images;
      updates.imagePublicIds = imagePublicIds;
    }

    listing = await PetListing.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    return sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Listing (soft delete → removed) ────────────────────────────────────
// DELETE /api/v1/listings/:id  — Private (owner only)
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await PetListing.findById(req.params.id);

    if (!listing) {
      return sendError(res, "Listing not found", 404);
    }

    if (listing.owner.toString() !== req.user._id.toString()) {
      return sendError(res, "Not authorized to delete this listing", 403);
    }

    // Clean up Cloudinary images
    if (listing.imagePublicIds && listing.imagePublicIds.length > 0) {
      for (const publicId of listing.imagePublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete Cloudinary image ${publicId}:`, err.message);
        }
      }
    }

    await PetListing.findByIdAndUpdate(req.params.id, { status: "removed" });

    return sendSuccess(res, { message: "Listing removed successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Listings ────────────────────────────────────────────────────────────
// GET /api/v1/listings/my  — Private
export const getMyListings = async (req, res, next) => {
  try {
    const listings = await PetListing.find({
      owner: req.user._id,
      status: { $ne: "removed" },
    }).sort("-createdAt");

    return sendSuccess(res, listings, 200, { count: listings.length, pagination: { total: listings.length, page: 1, pages: 1 } });
  } catch (error) {
    next(error);
  }
};

// ─── Mark as Sold/Adopted ─────────────────────────────────────────────────────
// PUT /api/v1/listings/:id/status  — Private (owner only)
export const updateListingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["sold", "adopted"];

    if (!validStatuses.includes(status)) {
      return sendError(res, `Status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const listing = await PetListing.findById(req.params.id);
    if (!listing) return sendError(res, "Listing not found", 404);

    if (listing.owner.toString() !== req.user._id.toString()) {
      return sendError(res, "Not authorized", 403);
    }

    listing.status = status;
    await listing.save();

    return sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};
