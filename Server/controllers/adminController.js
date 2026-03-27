import User from "../models/User.js";
import Pet from "../models/Pet.js";

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Pet.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalListings,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
