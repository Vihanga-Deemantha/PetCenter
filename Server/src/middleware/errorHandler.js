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

  // Structured, greppable server-side log line — a real APM/error tracker
  // (Sentry etc.) is the eventual upgrade, but until one is wired in this is
  // the difference between "a bug surfaces only if someone happens to grep
  // stdout" and having enough context (route, status, user, stack) to find
  // it after the fact.
  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        statusCode,
        message: err.message,
        userId: req.user?._id || null,
        stack: err.stack,
      })
    );
  }

  // Every branch above hand-crafts a safe, user-facing message for the error
  // shapes we anticipate. Anything else falling through with the raw
  // err.message (a generic programming/DB/third-party error) risks leaking
  // internal detail — connection strings, file paths, driver internals — to
  // the client. Only development gets the real message; production gets a
  // generic one (the real one is still in the structured log line above).
  const safeMessage = statusCode >= 500 && process.env.NODE_ENV !== "development"
    ? "Something went wrong. Please try again later."
    : message;

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
