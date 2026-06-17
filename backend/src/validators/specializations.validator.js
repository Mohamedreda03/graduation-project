const Joi = require("joi");

// Create specialization validation
const createSpecialization = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(200).trim(),
    code: Joi.string().required().uppercase().trim().max(10),
    faculty: Joi.string().required().trim(),
    description: Joi.string().max(1000).trim(),
    headOfSpecialization: Joi.string().hex().length(24),
    sectionsCount: Joi.object().pattern(Joi.string(), Joi.number().min(1).max(8)),
  }),
};

// Update specialization validation
const updateSpecialization = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(200).trim(),
    code: Joi.string().uppercase().trim().max(10),
    faculty: Joi.string().trim(),
    description: Joi.string().max(1000).trim(),
    headOfSpecialization: Joi.string().hex().length(24).allow(null),
    isActive: Joi.boolean(),
    sectionsCount: Joi.object().pattern(Joi.string(), Joi.number().min(1).max(8)),
  }),
};

// Get specialization by ID
const getSpecialization = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createSpecialization,
  updateSpecialization,
  getSpecialization,
};
