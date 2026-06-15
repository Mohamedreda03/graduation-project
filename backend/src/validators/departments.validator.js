const Joi = require("joi");

// Create department validation
const createDepartment = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(200).trim(),
    code: Joi.string().required().uppercase().trim().max(10),
    faculty: Joi.string().required().trim(),
    description: Joi.string().max(1000).trim(),
    headOfDepartment: Joi.string().hex().length(24),
    specializations: Joi.array().items(
      Joi.object({
        _id: Joi.string().hex().length(24).optional(),
        name: Joi.string().required().trim(),
        code: Joi.string().optional().allow("").trim().uppercase(),
      })
    ).default([]),
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
    specializations: Joi.array().items(
      Joi.object({
        _id: Joi.string().hex().length(24).optional(),
        name: Joi.string().required().trim(),
        code: Joi.string().optional().allow("").trim().uppercase(),
      })
    ),
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
