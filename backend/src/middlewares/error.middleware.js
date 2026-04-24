const ApiError = require("../utils/ApiError");
const config = require("../config/env");

/**
 * Error handling middleware
 * Handles all errors and prevents server crash
 */
const errorHandler = (err, req, res, next) => {
  // Ensure we always have an error object
  if (!err) {
    return res.status(500).json({
      success: false,
      error: "Unknown error occurred",
    });
  }

  let error = err;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = ApiError.badRequest("Invalid ID format");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    error = ApiError.conflict(`${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    error = ApiError.badRequest(messages.join(", ") || "Validation failed");
  }

  // JWT errors - IMPORTANT: Convert to ApiError with 401 status
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expired");
  }

  // Syntax error in JSON body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = ApiError.badRequest("Invalid JSON in request body");
  }

  // MongoDB connection errors
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongooseServerSelectionError"
  ) {
    error = ApiError.internal("Database connection error");
  }

  // Get final status code
  const statusCode = error.statusCode || 500;

  // Log error (always log in production for monitoring)
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    statusCode: statusCode,
    url: req.originalUrl,
    method: req.method,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: error.message || "Server Error",
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFound };
