const jwt = require("jsonwebtoken");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/env");
const { catchAsync } = require("../utils/helpers");

/**
 * Protect routes - require authentication
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Try to get from cookie (Web clients)
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Try to get from Authorization header (Mobile clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw ApiError.unauthorized("Not authorized to access this route");
  }

  // Verify token - let JWT errors bubble up to error handler
  const decoded = jwt.verify(token, config.jwt.secret);

  // Get user from token
  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("Account is deactivated");
  }

  req.user = user;
  next();
});

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  // 1. Try to get from cookie (Web clients)
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Try to get from Authorization header (Mobile clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
