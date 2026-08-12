import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import sendEmail from "../utils/sendEmail.js";
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

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password  — Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, "Please provide an email address", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether a user exists — always return success
      return sendSuccess(res, {
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    if (user.isDeleted || user.isBlocked) {
      return sendSuccess(res, {
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store hashed version in DB (never store raw tokens)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: "PetCenter — Password Reset Request 🔑",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fafbfc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px;">🐾</span>
              <h2 style="margin: 8px 0 0; color: #1e293b; font-weight: 800;">PetCenter</h2>
            </div>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Hi <strong>${user.name}</strong>,
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
              This link expires in <strong>30 minutes</strong>. If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #cbd5e1; font-size: 11px; text-align: center;">
              PetCenter — Find Pets, Shop Supplies & Build Habitats
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // If email fails, clear the reset token so user can retry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email send failed:", emailError.message);
      return sendError(res, "Email could not be sent. Please try again later.", 500);
    }

    return sendSuccess(res, {
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// PUT /api/v1/auth/reset-password/:resetToken  — Public
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return sendError(res, "Password must be at least 6 characters", 400);
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return sendError(res, "Invalid or expired reset token", 400);
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Invalidate existing sessions by clearing refresh token
    user.refreshToken = undefined;
    await user.save();

    return sendSuccess(res, {
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
