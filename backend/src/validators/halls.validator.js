const Joi = require("joi");

// MAC address pattern
const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

// Create hall validation
const createHall = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(100).trim(),
    building: Joi.string().required().trim(),
    floor: Joi.number().min(-5).max(20).default(0),
    capacity: Joi.number().min(1).max(1000),
    hallType: Joi.string()
      .valid("lecture_hall", "lab", "classroom")
      .default("lecture_hall"),
    accessPoint: Joi.object({
      macAddress: Joi.string()
        .pattern(macPattern)
        .required()
        .messages({
          "string.pattern.base":
            "Invalid MAC address format (use XX:XX:XX:XX:XX:XX)",
        }),
      ssid: Joi.string().required().trim(),
      ipAddress: Joi.string().ip({ version: ["ipv4"] }),
      model: Joi.string().trim(),
    }).required(),
  }),
};

// Update hall validation
const updateHall = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    building: Joi.string().trim(),
    floor: Joi.number().min(-5).max(20),
    capacity: Joi.number().min(1).max(1000),
    hallType: Joi.string().valid("lecture_hall", "lab", "classroom"),
    isActive: Joi.boolean(),
  }),
};

// Get hall by ID
const getHall = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Update access point
const updateAccessPoint = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    macAddress: Joi.string()
      .pattern(macPattern)
      .messages({ "string.pattern.base": "Invalid MAC address format" }),
    ssid: Joi.string().trim(),
    ipAddress: Joi.string().ip({ version: ["ipv4"] }),
    model: Joi.string().trim(),
    isActive: Joi.boolean(),
  }),
};

module.exports = {
  createHall,
  updateHall,
  getHall,
  updateAccessPoint,
};
