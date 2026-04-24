const ApiError = require("../utils/ApiError");
const { ROLES } = require("../config/constants");

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action"),
      );
    }

    next();
  };
};

/**
 * Admin only
 */
const adminOnly = restrictTo(ROLES.ADMIN);

/**
 * Doctor only
 */
const doctorOnly = restrictTo(ROLES.DOCTOR);

/**
 * Student only
 */
const studentOnly = restrictTo(ROLES.STUDENT);

/**
 * Admin or Doctor
 */
const adminOrDoctor = restrictTo(ROLES.ADMIN, ROLES.DOCTOR);

/**
 * Check if user is accessing their own resource or is admin
 */
const selfOrAdmin = (paramName = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated"));
    }

    const resourceId = req.params[paramName];
    const isSelf = req.user._id.toString() === resourceId;
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isSelf && !isAdmin) {
      return next(ApiError.forbidden("You can only access your own resources"));
    }

    next();
  };
};

module.exports = {
  restrictTo,
  adminOnly,
  doctorOnly,
  studentOnly,
  adminOrDoctor,
  selfOrAdmin,
};
