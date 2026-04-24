const Joi = require("joi");

// Create course validation
const createCourse = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(200).trim(),
    code: Joi.string().required().uppercase().trim(),
    department: Joi.string().hex().length(24).required(),
    doctor: Joi.string().hex().length(24).required(),
    creditHours: Joi.number().min(1).max(6).default(3),
    level: Joi.number().min(1).max(6),
    semester: Joi.number().valid(1, 2),
    description: Joi.string().max(1000).trim(),
  }),
};

// Update course validation
const updateCourse = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(200).trim(),
    code: Joi.string().uppercase().trim(),
    department: Joi.string().hex().length(24),
    doctor: Joi.string().hex().length(24),
    creditHours: Joi.number().min(1).max(6),
    level: Joi.number().min(1).max(6),
    semester: Joi.number().valid(1, 2),
    description: Joi.string().max(1000).trim(),
    isActive: Joi.boolean(),
  }),
};

// Get course by ID
const getCourse = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Add students to course
const addStudents = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    students: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(1)
      .required(),
  }),
};

// Remove student from course
const removeStudent = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
    studentId: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createCourse,
  updateCourse,
  getCourse,
  addStudents,
  removeStudent,
};
