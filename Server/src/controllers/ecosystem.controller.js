import Product from "../models/Products.js";
import EcosystemBuild from "../models/EcosystemBuild.js";
import PET_CONFIGS, { SUPPORTED_PET_TYPES } from "../config/petConfig.js";
import { getGeminiClient } from "../config/gemini.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { clampLimit, clampPage } from "../utils/pagination.js";

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
  if (!Array.isArray(selections)) {
    return { error: "selections must be an array" };
  }

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
    if (product.stock <= 0) {
      return { error: `"${product.name}" is out of stock` };
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

// ─── POST /ecosystem/suggest  — Public ───────────────────────────────────────
// Given a pet type and a budget (cents), greedily assembles a real, in-stock,
// budget-aware starter build — no LLM involved, so it can never suggest a
// product that doesn't exist, is out of stock, or isn't actually compatible.
// Required categories are always filled, best-rated-that-fits first, falling
// back to the cheapest option (even over budget) rather than leaving a
// required essential out — always reported honestly via `notes`/`overBudget`,
// never silently. Optional categories are added only while budget remains.
// Read-only: returns a selections array in the exact shape createBuild
// already accepts, so the client can hand it straight to the review step —
// this is a pre-fill suggestion, not a new selection/validation code path.
const pickBestForCategory = async (petType, category, remainingBudget) => {
  const candidates = await Product.find({
    compatiblePets: petType,
    tags: category.key,
    isActive: true,
    stock: { $gt: 0 },
  })
    .sort({ averageRating: -1, reviewCount: -1 })
    .lean();

  if (candidates.length === 0) return null;

  const affordable = candidates.filter((p) => p.price <= remainingBudget);
  if (affordable.length > 0) return affordable[0]; // best-rated among what fits

  // Nothing fits — for a required category, still return the cheapest
  // available option rather than leaving it empty; the caller reports this.
  if (category.required) {
    return [...candidates].sort((a, b) => a.price - b.price)[0];
  }

  return null;
};

export const suggestBuild = async (req, res, next) => {
  try {
    const { petType, budget } = req.body;

    if (!petType || !SUPPORTED_PET_TYPES.includes(petType)) {
      return sendError(res, `Unsupported pet type: "${petType}"`, 400);
    }

    const budgetCents = parseInt(budget);
    if (!Number.isInteger(budgetCents) || budgetCents <= 0) {
      return sendError(res, "budget must be a positive whole number of cents", 400);
    }

    const config = PET_CONFIGS[petType];
    const requiredCategories = config.categories.filter((c) => c.required);
    const optionalCategories = config.categories.filter((c) => !c.required);

    let remaining = budgetCents;
    const selections = [];
    const notes = [];

    for (const category of requiredCategories) {
      const product = await pickBestForCategory(petType, category, remaining);
      if (!product) {
        notes.push(`No compatible in-stock product was found for the required "${category.label}" category.`);
        continue;
      }
      if (product.price > remaining) {
        notes.push(`Included "${product.name}" for the required "${category.label}" category even though it goes over budget.`);
      }
      selections.push({
        categoryKey: category.key,
        productId: product._id,
        productSnapshot: { name: product.name, price: product.price, image: product.images?.[0]?.url || "" },
      });
      remaining -= product.price;
    }

    for (const category of optionalCategories) {
      if (remaining <= 0) break;
      const product = await pickBestForCategory(petType, category, remaining);
      if (!product) continue; // nothing affordable/available — optional, just skip
      selections.push({
        categoryKey: category.key,
        productId: product._id,
        productSnapshot: { name: product.name, price: product.price, image: product.images?.[0]?.url || "" },
      });
      remaining -= product.price;
    }

    const totalPrice = calcTotal(selections);

    return sendSuccess(res, {
      petType,
      budget: budgetCents,
      selections,
      totalPrice,
      overBudget: totalPrice > budgetCents,
      remainingBudget: Math.max(0, budgetCents - totalPrice),
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /ecosystem/narrate  — Public ───────────────────────────────────────
// Writes a short, friendly explanation of a selection the caller has already
// assembled (normally the output of /ecosystem/suggest). The model only ever
// narrates the exact items it's handed in the prompt — it never picks or
// invents products, so a hallucinated recommendation is structurally not
// possible here, regardless of what the model does. If no API key is
// configured, or the call fails for any reason, this falls back to a plain
// sentence built directly from the real data rather than ever erroring out —
// the feature degrades to "less flowery" text, never to "broken."
const NARRATION_CACHE = new Map();
const NARRATION_CACHE_MAX = 200;

const narrationCacheKey = (petType, items) =>
  `${petType}::${items.map((i) => `${i.category}:${i.name}:${i.price}`).sort().join("|")}`;

const buildFallbackNarration = (items, overBudget, notes) => {
  const names = items.map((i) => i.name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] || "these essentials";
  let text = `We put together ${list} for this setup.`;
  if (overBudget && notes?.[0]) {
    text += ` ${notes[0]}`;
  }
  return text;
};

export const narrateBuild = async (req, res, next) => {
  try {
    const { petType, budget, totalPrice, overBudget, notes, items } = req.body;

    if (!petType || !SUPPORTED_PET_TYPES.includes(petType)) {
      return sendError(res, `Unsupported pet type: "${petType}"`, 400);
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return sendError(res, "items must be a non-empty array of at most 20", 400);
    }
    for (const item of items) {
      if (typeof item.category !== "string" || typeof item.name !== "string" || typeof item.price !== "number") {
        return sendError(res, "Each item needs a category, name, and price", 400);
      }
    }

    const cacheKey = narrationCacheKey(petType, items);
    const cached = NARRATION_CACHE.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const client = getGeminiClient();
    let result;

    if (!client) {
      result = { narration: buildFallbackNarration(items, overBudget, notes), source: "fallback" };
    } else {
      try {
        const itemLines = items.map((i) => `- ${i.category}: ${i.name} ($${(i.price / 100).toFixed(2)})`).join("\n");
        const budgetLine = budget ? `Customer's budget: $${(budget / 100).toFixed(2)}.` : "";
        const totalLine = typeof totalPrice === "number"
          ? `Total cost: $${(totalPrice / 100).toFixed(2)}${overBudget ? " (slightly over budget to include every required essential)" : ""}.`
          : "";

        const response = await client.models.generateContent({
          // flash-lite (not flash) deliberately — this is a simple, single-
          // step writing task with no reasoning required. gemini-flash-latest
          // spends a large, non-optional share of maxOutputTokens on hidden
          // "thinking" tokens even with thinkingBudget: 0 (that config option
          // isn't honored by every model), which truncated the narration to
          // a handful of words before any visible text was produced.
          // flash-lite doesn't do implicit reasoning, so the full token
          // budget goes to the actual response.
          model: "gemini-flash-lite-latest",
          contents: `Pet type: ${petType}\n${budgetLine}\n${totalLine}\nItems:\n${itemLines}`,
          config: {
            maxOutputTokens: 200,
            systemInstruction:
              "You are a friendly copywriter for PetCenter, a pet supplies platform. You'll be given a list of products our own system has ALREADY selected for a customer's pet habitat starter kit — every item is real, in stock, and already chosen. Write a short, warm explanation of why this combination works well for the pet. Only reference the items explicitly given to you — never suggest, imply, or invent any other product, brand, or accessory, and never recommend the customer add anything else. Keep it to 2-3 sentences. Plain text only, no markdown.",
          },
        });

        const text = response.text?.trim();
        result = text
          ? { narration: text, source: "ai" }
          : { narration: buildFallbackNarration(items, overBudget, notes), source: "fallback" };
      } catch (err) {
        console.error("Ecosystem narration AI call failed, using fallback:", err.message);
        result = { narration: buildFallbackNarration(items, overBudget, notes), source: "fallback" };
      }
    }

    if (NARRATION_CACHE.size >= NARRATION_CACHE_MAX) {
      NARRATION_CACHE.delete(NARRATION_CACHE.keys().next().value);
    }
    NARRATION_CACHE.set(cacheKey, result);

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
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

      // togglePublish is not the only way selections can change — without
      // this check, editing an already-published build could drop a required
      // category (or empty it entirely) while isPublished stays true, so the
      // public gallery would keep serving an incomplete "complete setup".
      if (build.isPublished) {
        const missing = getMissingRequired(build.petType, resolvedSelections);
        if (missing.length > 0) {
          return sendError(
            res,
            `This build is published and must keep all required categories filled — missing ${missing.join(", ")}. Unpublish it first if you want to remove them.`,
            400
          );
        }
      }

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
      petType,
      sort = "newest",
    } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, { max: 60, fallback: 12 });

    const filter = { isPublished: true };
    if (petType && SUPPORTED_PET_TYPES.includes(petType)) {
      filter.petType = petType;
    }

    let sortObj = { publishedAt: -1 }; // newest
    if (sort === "mostCloned") sortObj = { cloneCount: -1 };

    const skip = (page - 1) * limit;

    const [builds, total] = await Promise.all([
      EcosystemBuild.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name") // Only expose display name
        .lean(),
      EcosystemBuild.countDocuments(filter),
    ]);

    return sendSuccess(res, builds, 200, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
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
