import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/generateToken.js";

// ─── Register ────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register  — Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, location } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, "An account with that email already exists", 409);
    }

    const user = await User.create({ name, email, password, phone, location });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store hashed refresh token (store raw for now — can hash later)
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
        },
        accessToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login  — Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Please provide email and password", 400);
    }

    const user = await User.findOne({ email }).select("+password +refreshToken");

    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, "Invalid email or password", 401);
    }

    if (user.isDeleted) {
      return sendError(res, "This account has been deleted.", 403);
    }

    if (user.isBlocked) {
      return sendError(res, "Your account has been blocked. Contact support.", 403);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.updateOne({ _id: user._id }, { refreshToken: refreshToken });

    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        location: user.location,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh-token  — Public (uses HttpOnly cookie)
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return sendError(res, "No refresh token provided", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return sendError(res, "Refresh token mismatch — please login again", 401);
    }

    if (user.isBlocked) {
      return sendError(res, "Your account has been blocked", 403);
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.updateOne({ _id: user._id }, { refreshToken: newRefreshToken });

    setRefreshTokenCookie(res, newRefreshToken);

    return sendSuccess(res, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout  — Private
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+refreshToken");
    if (user) {
      await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1 } });
    }

    clearRefreshTokenCookie(res);
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── Get Me ──────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me  — Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
// PUT /api/v1/auth/profile  — Private
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["name", "phone", "location"];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// ─── Upload Profile Photo ─────────────────────────────────────────────────────
// PUT /api/v1/auth/profile/photo  — Private
export const uploadProfilePhotoHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, "Please upload an image file", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: req.file.path,
        profileImagePublicId: req.file.filename,
      },
      { returnDocument: "after" }
    );

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
