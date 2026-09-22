import axiosInstance from "./axiosInstance";

// ─── Pet Config (public) ──────────────────────────────────────────────────────
/** Returns the list of supported pet types for the picker grid */
export const getPetList = () =>
  axiosInstance.get("/ecosystem/pets");

/** Returns the full habitat profile for a single pet type */
export const getPetConfig = (petType) =>
  axiosInstance.get(`/ecosystem/pets/${petType}/config`);

/**
 * Requests a budget-aware starter build suggestion — a deterministic
 * pick from real, in-stock, compatible products (no LLM, nothing invented).
 * @param {string} petType
 * @param {number} budget - cents
 */
export const suggestBuild = (petType, budget) =>
  axiosInstance.post("/ecosystem/suggest", { petType, budget });

/**
 * Requests a short AI-written explanation of a selection the caller already
 * has (the model only ever narrates the exact items given — it never picks
 * products). Falls back server-side to a plain sentence if no API key is
 * configured or the call fails, so this never rejects.
 * @param {{ petType: string, budget?: number, totalPrice?: number, overBudget?: boolean, notes?: string[], items: Array<{category: string, name: string, price: number}> }} data
 */
export const narrateBuild = (data) =>
  axiosInstance.post("/ecosystem/narrate", data);

// ─── Gallery (public) ─────────────────────────────────────────────────────────
/** Returns paginated published builds. Params: { page, limit, petType, sort } */
export const getGallery = (params = {}) =>
  axiosInstance.get("/ecosystem/gallery", { params });

/** Returns full detail of a single published build by ID */
export const getGalleryBuild = (id) =>
  axiosInstance.get(`/ecosystem/gallery/${id}`);

// ─── Gallery Actions (protected) ──────────────────────────────────────────────
/** Clones a published gallery build into the logged-in user's saved builds */
export const cloneBuild = (id) =>
  axiosInstance.post(`/ecosystem/gallery/${id}/clone`);

// ─── My Builds (protected) ────────────────────────────────────────────────────
/** Returns all builds owned by the logged-in user, sorted newest first */
export const getMyBuilds = () =>
  axiosInstance.get("/ecosystem/my-builds");

/**
 * Creates a new saved ecosystem build.
 * @param {{ name: string, petType: string, selections: Array<{categoryKey, productId}> }} data
 */
export const createBuild = (data) =>
  axiosInstance.post("/ecosystem/builds", data);

/**
 * Updates an existing build (name and/or selections).
 * @param {string} id - Build ID
 * @param {{ name?: string, selections?: Array }} data
 */
export const updateBuild = (id, data) =>
  axiosInstance.put(`/ecosystem/builds/${id}`, data);

/** Deletes a saved build by ID (owner only) */
export const deleteBuild = (id) =>
  axiosInstance.delete(`/ecosystem/builds/${id}`);

/** Toggles isPublished on a build (validates required categories before publishing) */
export const togglePublish = (id) =>
  axiosInstance.patch(`/ecosystem/builds/${id}/publish`);

// ─── Cart (protected) ─────────────────────────────────────────────────────────
/**
 * Bulk-adds an array of products to cart in a single request.
 * @param {Array<{ productId: string, quantity: number }>} items
 * @returns {{ added: [], failed: [], itemCount: number }}
 */
export const bulkAddToCart = (items) =>
  axiosInstance.post("/cart/bulk", { items });
