const Joi = require("joi");
const { DAYS, WORKING_DAYS } = require("../config/constants");

// Time format validation (HH:MM)
const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Create lecture validation
const createLecture = {
  body: Joi.object({
    course: Joi.string().hex().length(24).required(),
    hall: Joi.string().hex().length(24).required(),
    dayOfWeek: Joi.number()
      .valid(...WORKING_DAYS)
      .required()
      .messages({ "any.only": "Lectures cannot be scheduled on Friday" }),
    startTime: Joi.string()
      .pattern(timePattern)
      .required()
      .messages({
        "string.pattern.base": "Start time must be in HH:MM format",
      }),
    endTime: Joi.string()
      .pattern(timePattern)
      .required()
      .messages({ "string.pattern.base": "End time must be in HH:MM format" }),
    lectureType: Joi.string()
      .valid("lecture", "section", "lab")
      .default("lecture"),
    weekPattern: Joi.string().valid("weekly", "odd", "even").default("weekly"),
  }),
};

// Update lecture validation
const updateLecture = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    hall: Joi.string().hex().length(24),
    dayOfWeek: Joi.number()
      .valid(...WORKING_DAYS)
      .messages({ "any.only": "Lectures cannot be scheduled on Friday" }),
    startTime: Joi.string()
      .pattern(timePattern)
      .messages({
        "string.pattern.base": "Start time must be in HH:MM format",
      }),
    endTime: Joi.string()
      .pattern(timePattern)
      .messages({ "string.pattern.base": "End time must be in HH:MM format" }),
    lectureType: Joi.string().valid("lecture", "section", "lab"),
    weekPattern: Joi.string().valid("weekly", "odd", "even"),
    isActive: Joi.boolean(),
  }),
};

// Get lecture by ID
const getLecture = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Get lectures by hall
const getLecturesByHall = {
  params: Joi.object({
    hallId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    dayOfWeek: Joi.number().min(0).max(6),
  }),
};

// Get lectures by course
const getLecturesByCourse = {
  params: Joi.object({
    courseId: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createLecture,
  updateLecture,
  getLecture,
  getLecturesByHall,
  getLecturesByCourse,
};
