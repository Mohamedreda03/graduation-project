const Joi = require("joi");

// Create specialization validation
const createSpecialization = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(200).trim(),
    code: Joi.string().required().uppercase().trim().max(10),
    description: Joi.string().max(1000).trim(),
    headOfSpecialization: Joi.string().hex().length(24),
    departments: Joi.array().items(Joi.string().trim()),
    levels: Joi.array().items(
      Joi.object({
        level: Joi.number().required(),
        name: Joi.string().required().trim(),
        hasDepartments: Joi.boolean().default(false),
        sectionsCount: Joi.number().min(1).max(20).default(2)
      })
    ),
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
    description: Joi.string().max(1000).trim(),
    headOfSpecialization: Joi.string().hex().length(24).allow(null),
    isActive: Joi.boolean(),
    departments: Joi.array().items(Joi.string().trim()),
    levels: Joi.array().items(
      Joi.object({
        level: Joi.number().required(),
        name: Joi.string().required().trim(),
        hasDepartments: Joi.boolean().default(false),
        sectionsCount: Joi.number().min(1).max(20).default(2)
      })
    ),
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
