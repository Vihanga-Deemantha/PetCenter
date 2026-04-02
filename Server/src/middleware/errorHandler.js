// Global error handler
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = `Resource not found`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File too large. Max size is 5MB per image";
    statusCode = 400;
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    message = "Too many files. Maximum 5 images allowed";
    statusCode = 400;
  }
  
  // Cloudinary / Multer file format errors
  if (err.message && err.message.includes("Invalid image file")) {
    message = "Invalid file type. Only JPG, PNG, and WebP are allowed.";
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
