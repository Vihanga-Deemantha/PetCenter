import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

// Protect routes — verify JWT access token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, "Not authorized to access this route", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, "User not found", 401);
    }

    if (user.isBlocked) {
      return sendError(res, "Your account has been blocked. Contact support.", 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, "Not authorized — invalid or expired token", 401);
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};
