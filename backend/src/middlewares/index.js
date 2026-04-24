const { protect, optionalAuth } = require("./auth.middleware");
const {
  restrictTo,
  adminOnly,
  doctorOnly,
  studentOnly,
  adminOrDoctor,
  selfOrAdmin,
} = require("./role.middleware");
const {
  validate,
  validateParams,
  validateQuery,
} = require("./validate.middleware");
const { errorHandler, notFound } = require("./error.middleware");
const { verifyAccessPoint } = require("./ap.middleware");

module.exports = {
  // Auth
  protect,
  optionalAuth,

  // Roles
  restrictTo,
  adminOnly,
  doctorOnly,
  studentOnly,
  adminOrDoctor,
  selfOrAdmin,

  // Validation
  validate,
  validateParams,
  validateQuery,

  // Error handling
  errorHandler,
  notFound,

  // Access Point
  verifyAccessPoint,
};
