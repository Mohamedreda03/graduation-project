const Joi = require("joi");

// Create department validation
const createDepartment = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(200).trim(),
    code: Joi.string().required().uppercase().trim().max(10),
    faculty: Joi.string().required().trim(),
    description: Joi.string().max(1000).trim(),
    headOfDepartment: Joi.string().hex().length(24),
  }),
};

// Update department validation
const updateDepartment = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(200).trim(),
    code: Joi.string().uppercase().trim().max(10),
    faculty: Joi.string().trim(),
    description: Joi.string().max(1000).trim(),
    headOfDepartment: Joi.string().hex().length(24).allow(null),
    isActive: Joi.boolean(),
  }),
};

// Get department by ID
const getDepartment = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createDepartment,
  updateDepartment,
  getDepartment,
};
