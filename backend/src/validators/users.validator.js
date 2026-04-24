const Joi = require("joi");
const { ROLES } = require("../config/constants");

// Create user validation
const createUser = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(100).trim(),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(6).max(50),
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .required(),
    studentId: Joi.when("role", {
      is: ROLES.STUDENT,
      then: Joi.string().required().trim(),
      otherwise: Joi.forbidden(),
    }),
    department: Joi.string().hex().length(24),
    level: Joi.when("role", {
      is: ROLES.STUDENT,
      then: Joi.number().min(1).max(6),
      otherwise: Joi.forbidden(),
    }),
    phone: Joi.string()
      .pattern(/^01[0125][0-9]{8}$/)
      .message("Invalid Egyptian phone number"),
  }),
};

// Update user validation
const updateUser = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(100).trim(),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string()
      .pattern(/^01[0125][0-9]{8}$/)
      .message("Invalid Egyptian phone number"),
    department: Joi.string().hex().length(24),
    level: Joi.number().min(1).max(6),
    isActive: Joi.boolean(),
  }),
};

// Get user by ID
const getUser = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Delete user
const deleteUser = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createUser,
  updateUser,
  getUser,
  deleteUser,
};
