import Pet from "../models/Pet.js";

// @desc    Get all pets
// @route   GET /api/v1/pets
// @access  Public
export const getPets = async (req, res, next) => {
  try {
    let query;

    // Advanced filtering
    const reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    query = Pet.find(JSON.parse(queryStr));

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const total = await Pet.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const pets = await query;

    res.status(200).json({
      success: true,
      count: pets.length,
      pagination: {
        total,
        page,
        limit,
      },
      data: pets,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single pet
// @route   GET /api/v1/pets/:id
// @access  Public
export const getPet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id).populate({
      path: "owner",
      select: "name email phone location",
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new pet listing
// @route   POST /api/v1/pets
// @access  Private
export const createPet = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.owner = req.user.id;

    const pet = await Pet.create(req.body);

    res.status(201).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update pet
// @route   PUT /api/v1/pets/:id
// @access  Private
export const updatePet = async (req, res, next) => {
  try {
    let pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Pet not found",
      });
    }

    // Make sure user is pet owner or admin
    if (pet.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        error: "Not authorized to update this listing",
      });
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete pet
// @route   DELETE /api/v1/pets/:id
// @access  Private
export const deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        error: "Pet not found",
      });
    }

    // Make sure user is pet owner or admin
    if (pet.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        error: "Not authorized to delete this listing",
      });
    }

    await pet.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get logged in user's pet listings
// @route   GET /api/v1/pets/my/listings
// @access  Private
export const getMyPets = async (req, res, next) => {
  try {
    const pets = await Pet.find({ owner: req.user.id });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
