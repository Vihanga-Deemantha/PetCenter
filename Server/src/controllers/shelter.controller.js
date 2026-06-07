import Shelter from "../models/Shelter.js";
import Campaign from "../models/Campaign.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── Get Public Shelters (Filterable, Paginated, Searchable) ───────────────────
// GET /api/v1/shelters — Public
export const getShelters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, city, search } = req.query;

    const filter = { isActive: true };

    if (type) {
      filter.type = type;
    }

    if (city) {
      filter["location.city"] = { $regex: new RegExp(city, "i") };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Omit sensitive contact fields to prevent bulk scraping
    const [shelters, total] = await Promise.all([
      Shelter.find(filter)
        .select("-contact.phone -contact.email")
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Shelter.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return sendSuccess(res, shelters, 200, {
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Public Shelter Details (Omitted contacts) ───────────────────────────
// GET /api/v1/shelters/:id — Public
export const getShelterDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shelter = await Shelter.findOne({ _id: id, isActive: true })
      .select("-contact.phone -contact.email")
      .lean();

    if (!shelter) {
      return sendError(res, "Shelter not found", 404);
    }

    // Get active campaigns for this shelter
    const campaigns = await Campaign.find({ beneficiary: id, status: "active", deletedAt: null }).lean();

    return sendSuccess(res, {
      ...shelter,
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Scrape-Safe Contact Reveal ──────────────────────────────────────────────
// POST /api/v1/shelters/:id/reveal-contact — Public
export const revealShelterContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shelter = await Shelter.findOne({ _id: id, isActive: true }).select("contact.phone contact.email").lean();

    if (!shelter) {
      return sendError(res, "Shelter not found", 404);
    }

    return sendSuccess(res, {
      phone: shelter.contact?.phone || "No phone number available",
      email: shelter.contact?.email || "No email address available",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Admin Shelters (Includes Full Contacts & Inactive) ────────────────────
// GET /api/v1/admin/shelters — Admin Only
export const getAdminShelters = async (req, res, next) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, shelters);
  } catch (error) {
    next(error);
  }
};

// ─── Create Shelter (Admin Only) ──────────────────────────────────────────────
// POST /api/v1/admin/shelters — Admin Only
export const createShelter = async (req, res, next) => {
  try {
    const { name, type, description, city, country, phone, email, website, needsList, isVerified } = req.body;

    let logo = null;
    if (req.file) {
      logo = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    // Parse needsList if it comes as a string representation of array or csv
    let parsedNeeds = [];
    if (needsList) {
      parsedNeeds = Array.isArray(needsList)
        ? needsList
        : typeof needsList === "string"
        ? needsList.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

    const shelterData = {
      name,
      type,
      description,
      location: { city, country },
      contact: { phone, email, website },
      logo,
      needsList: parsedNeeds,
      isVerified: isVerified === "true" || isVerified === true,
      isActive: true,
    };

    const shelter = await Shelter.create(shelterData);
    return sendSuccess(res, shelter, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Update Shelter (Admin Only) ──────────────────────────────────────────────
// PUT /api/v1/admin/shelters/:id — Admin Only
export const updateShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      description,
      city,
      country,
      phone,
      email,
      website,
      needsList,
      isVerified,
      isActive,
    } = req.body;

    const shelter = await Shelter.findById(id);

    if (!shelter) {
      return sendError(res, "Shelter not found", 404);
    }

    if (name) shelter.name = name;
    if (type) shelter.type = type;
    if (description) shelter.description = description;

    if (city || country) {
      shelter.location = {
        city: city || shelter.location.city,
        country: country || shelter.location.country,
      };
    }

    if (phone !== undefined || email !== undefined || website !== undefined) {
      shelter.contact = {
        phone: phone !== undefined ? phone : shelter.contact.phone,
        email: email !== undefined ? email : shelter.contact.email,
        website: website !== undefined ? website : shelter.contact.website,
      };
    }

    if (needsList !== undefined) {
      shelter.needsList = Array.isArray(needsList)
        ? needsList
        : typeof needsList === "string"
        ? needsList.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (isVerified !== undefined) {
      shelter.isVerified = isVerified === "true" || isVerified === true;
    }

    if (isActive !== undefined) {
      shelter.isActive = isActive === "true" || isActive === true;
    }

    if (req.file) {
      shelter.logo = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    await shelter.save();
    return sendSuccess(res, shelter);
  } catch (error) {
    next(error);
  }
};

// ─── Delete Shelter (Admin Only) ──────────────────────────────────────────────
// DELETE /api/v1/admin/shelters/:id — Admin Only
export const deleteShelter = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if shelter is linked to any campaigns
    const campaignCount = await Campaign.countDocuments({ beneficiary: id, deletedAt: null });

    if (campaignCount > 0) {
      return sendError(res, "Cannot delete shelter. It is currently the beneficiary of active or saved campaigns.", 400);
    }

    const shelter = await Shelter.findByIdAndDelete(id);

    if (!shelter) {
      return sendError(res, "Shelter not found", 404);
    }

    return sendSuccess(res, { message: "Shelter deleted successfully" });
  } catch (error) {
    next(error);
  }
};
