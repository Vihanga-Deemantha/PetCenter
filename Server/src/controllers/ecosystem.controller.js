import Product from "../models/Products.js";
import EcosystemBuild from "../models/EcosystemBuild.js";
import PET_CONFIGS, { SUPPORTED_PET_TYPES } from "../config/petConfig.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Helper: ownerOnly guard ──────────────────────────────────────────────────
// Inline ownership check — avoids a separate middleware file.
const assertOwner = (build, userId) =>
  build.userId.toString() === userId.toString();

// ─── Helper: calculate total price ───────────────────────────────────────────
const calcTotal = (selections) =>
  selections.reduce((sum, s) => sum + (s.productSnapshot?.price || 0), 0);

// ─── Helper: validate all required categories are filled ─────────────────────
const getMissingRequired = (petType, selections) => {
  const config = PET_CONFIGS[petType];
  if (!config) return [];
  const requiredKeys = config.categories.filter((c) => c.required).map((c) => c.key);
  const filledKeys = selections.map((s) => s.categoryKey);
  return requiredKeys.filter((k) => !filledKeys.includes(k));
};

// ─── Helper: resolve + validate a submitted selections array ─────────────────
// The picker UI only ever offers products whose compatiblePets/tags/category
// limits already line up, but that's client-side convenience, not
// enforcement — a request built by hand could submit any productId under any
// categoryKey. This re-derives the same rules server-side so a saved (and
// possibly published) build can never disagree with what the picker allows.
const resolveAndValidateSelections = async (petType, selections) => {
  const config = PET_CONFIGS[petType];
  const categoryByKey = {};
  config.categories.forEach((c) => { categoryByKey[c.key] = c; });

  const countByCategory = {};
  const resolvedSelections = [];

  for (const sel of selections) {
    if (!sel.productId || !sel.categoryKey) {
      return { error: "Each selection must include productId and categoryKey" };
    }

    const category = categoryByKey[sel.categoryKey];
    if (!category) {
      return { error: `"${sel.categoryKey}" is not a valid category for ${petType} builds` };
    }

    const product = await Product.findById(sel.productId).lean();
    if (!product || !product.isActive) {
      return { error: `Product "${sel.productId}" not found or is no longer available` };
    }
    if (!product.compatiblePets?.includes(petType)) {
      return { error: `"${product.name}" is not compatible with ${petType} habitats` };
    }
    if (!product.tags?.includes(sel.categoryKey)) {
      return { error: `"${product.name}" does not belong in the "${category.label}" category` };
    }

    countByCategory[sel.categoryKey] = (countByCategory[sel.categoryKey] || 0) + 1;
    if (countByCategory[sel.categoryKey] > category.maxSelectable) {
      return { error: `"${category.label}" allows at most ${category.maxSelectable} selection(s)` };
    }

    resolvedSelections.push({
      categoryKey: sel.categoryKey,
      productId: product._id,
      productSnapshot: {
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || "",
      },
    });
  }

  return { resolvedSelections };
};

// ─── GET /ecosystem/pets  — Public ───────────────────────────────────────────
// Returns the list of supported pet types for the picker step.
export const getPetList = async (_req, res, next) => {
  try {
    const pets = Object.entries(PET_CONFIGS).map(([key, config]) => ({
      key,
      displayName: config.displayName,
      iconName: config.iconName,
      description: config.description,
    }));
    return sendSuccess(res, pets);
  } catch (error) {
    next(error);
  }
};

// ─── GET /ecosystem/pets/:petType/config  — Public ──────────────────────────
// Returns the full habitat profile for a single pet type.
export const getPetConfig = async (req, res, next) => {
  try {
    const { petType } = req.params;
    if (!SUPPORTED_PET_TYPES.includes(petType)) {
      return sendError(res, `Unsupported pet type: "${petType}". Must be one of: ${SUPPORTED_PET_TYPES.join(", ")}`, 400);
    }
    return sendSuccess(res, PET_CONFIGS[petType]);
  } catch (error) {
    next(error);
  }
};

// ─── GET /ecosystem/my-builds  — Protected ───────────────────────────────────
// Returns all builds for the logged-in user, newest first.
export const getMyBuilds = async (req, res, next) => {
  try {
    const builds = await EcosystemBuild
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, builds);
  } catch (error) {
    next(error);
  }
};

// ─── POST /ecosystem/builds  — Protected ────────────────────────────────────
// Creates a new saved ecosystem build.
export const createBuild = async (req, res, next) => {
  try {
    const { name, petType, selections = [] } = req.body;

    if (!name || !petType) {
      return sendError(res, "name and petType are required", 400);
    }

    if (!SUPPORTED_PET_TYPES.includes(petType)) {
      return sendError(res, `Unsupported pet type: "${petType}"`, 400);
    }

    // Validate all productIds exist, are compatible/active, and respect
    // each category's selection cap — then build snapshots.
    const { error, resolvedSelections } = await resolveAndValidateSelections(petType, selections);
    if (error) return sendError(res, error, 400);

    const build = await EcosystemBuild.create({
      userId: req.user._id,
      name,
      petType,
      selections: resolvedSelections,
      totalPrice: calcTotal(resolvedSelections),
    });

    return sendSuccess(res, build, 201);
  } catch (error) {
    next(error);
  }
};

// ─── PUT /ecosystem/builds/:id  — Protected + ownerOnly ─────────────────────
// Updates build name and/or selections. Recalculates totalPrice.
export const updateBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, selections } = req.body;

    const build = await EcosystemBuild.findById(id);
    if (!build) return sendError(res, "Build not found", 404);
    if (!assertOwner(build, req.user._id)) return sendError(res, "Forbidden", 403);

    if (name !== undefined) build.name = name;

    if (selections !== undefined) {
      const { error, resolvedSelections } = await resolveAndValidateSelections(build.petType, selections);
      if (error) return sendError(res, error, 400);

      build.selections = resolvedSelections;
      build.totalPrice = calcTotal(resolvedSelections);
    }

    await build.save();
    return sendSuccess(res, build);
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /ecosystem/builds/:id  — Protected + ownerOnly ──────────────────
// Hard delete (builds have no external dependencies unlike orders).
export const deleteBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const build = await EcosystemBuild.findById(id);
    if (!build) return sendError(res, "Build not found", 404);
    if (!assertOwner(build, req.user._id)) return sendError(res, "Forbidden", 403);

    await EcosystemBuild.findByIdAndDelete(id);
    return sendSuccess(res, { message: "Build deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /ecosystem/builds/:id/publish  — Protected + ownerOnly ───────────
// Toggles isPublished. Publishing validates all required categories are filled.
// Unpublishing has no restrictions.
export const togglePublish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const build = await EcosystemBuild.findById(id);
    if (!build) return sendError(res, "Build not found", 404);
    if (!assertOwner(build, req.user._id)) return sendError(res, "Forbidden", 403);

    if (!build.isPublished) {
      // Publishing: validate required categories
      const missing = getMissingRequired(build.petType, build.selections);
      if (missing.length > 0) {
        return sendError(
          res,
          `Cannot publish: missing required categories — ${missing.join(", ")}. Complete your build first.`,
          400
        );
      }
      build.isPublished = true;
      build.publishedAt = new Date();
    } else {
      // Unpublishing
      build.isPublished = false;
      build.publishedAt = null;
    }

    await build.save();
    return sendSuccess(res, build);
  } catch (error) {
    next(error);
  }
};

// ─── GET /ecosystem/gallery  — Public ────────────────────────────────────────
// Returns paginated published builds. Filterable by petType, sortable.
export const getGallery = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      petType,
      sort = "newest",
    } = req.query;

    const filter = { isPublished: true };
    if (petType && SUPPORTED_PET_TYPES.includes(petType)) {
      filter.petType = petType;
    }

    let sortObj = { publishedAt: -1 }; // newest
    if (sort === "mostCloned") sortObj = { cloneCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [builds, total] = await Promise.all([
      EcosystemBuild.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "name") // Only expose display name
        .lean(),
      EcosystemBuild.countDocuments(filter),
    ]);

    return sendSuccess(res, builds, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /ecosystem/gallery/:id  — Public ────────────────────────────────────
// Returns the full detail of a single published build.
export const getGalleryBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const build = await EcosystemBuild
      .findById(id)
      .populate("userId", "name")
      .lean();

    if (!build || !build.isPublished) {
      return sendError(res, "Build not found or is not published", 404);
    }

    return sendSuccess(res, build);
  } catch (error) {
    next(error);
  }
};

// ─── POST /ecosystem/gallery/:id/clone  — Protected ──────────────────────────
// Creates a copy of a published build under the logged-in user's account.
// Atomically increments cloneCount on the source build.
export const cloneGalleryBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const source = await EcosystemBuild.findById(id).lean();

    if (!source || !source.isPublished) {
      return sendError(res, "Build not found or is not published", 404);
    }

    // Create a copy owned by the current user
    const cloned = await EcosystemBuild.create({
      userId: req.user._id,
      name: `${source.name} (Clone)`,
      petType: source.petType,
      selections: source.selections,  // snapshots copied directly
      totalPrice: source.totalPrice,
      clonedFrom: source._id,
      isPublished: false, // clones start as private
    });

    // Atomically increment clone count on the source
    await EcosystemBuild.findByIdAndUpdate(id, { $inc: { cloneCount: 1 } });

    return sendSuccess(res, cloned, 201);
  } catch (error) {
    next(error);
  }
};
