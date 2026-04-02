import { sendError } from "../utils/apiResponse.js";

// Only allow admins
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return sendError(res, "Admin access required", 403);
};
