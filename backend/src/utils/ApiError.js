class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory methods
ApiError.badRequest = (message = "Bad Request") => new ApiError(message, 400);
ApiError.unauthorized = (message = "Unauthorized") =>
  new ApiError(message, 401);
ApiError.forbidden = (message = "Forbidden") => new ApiError(message, 403);
ApiError.notFound = (message = "Not Found") => new ApiError(message, 404);
ApiError.conflict = (message = "Conflict") => new ApiError(message, 409);
ApiError.internal = (message = "Internal Server Error") =>
  new ApiError(message, 500);

module.exports = ApiError;
