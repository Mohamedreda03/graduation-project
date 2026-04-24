const Joi = require("joi");

// Create student validation
const createStudent = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(100).trim(),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(6).max(50),
    studentId: Joi.string().required().trim(),
    department: Joi.string().hex().length(24).required(),
    level: Joi.number().min(1).max(6).required(),
    phone: Joi.string()
      .pattern(/^01[0125][0-9]{8}$/)
      .message("Invalid Egyptian phone number"),
  }),
};

// Bulk create students
const bulkCreateStudents = {
  body: Joi.object({
    students: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required().min(3).max(100).trim(),
          email: Joi.string().required().email().lowercase().trim(),
          studentId: Joi.string().required().trim(),
          department: Joi.string().hex().length(24).required(),
          level: Joi.number().min(1).max(6).required(),
        }),
      )
      .min(1)
      .max(100)
      .required(),
    defaultPassword: Joi.string().min(6).max(50).default("123456"),
  }),
};

// Update student validation
const updateStudent = {
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

// Get student by ID
const getStudent = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Bind device validation
const bindDevice = {
  body: Joi.object({
    deviceId: Joi.string().required().trim(),
    macAddress: Joi.string()
      .required()
      .pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
      .message("Invalid MAC address format"),
    deviceModel: Joi.string().trim(),
    osVersion: Joi.string().trim(),
  }),
};

// Request device change
const requestDeviceChange = {
  body: Joi.object({
    reason: Joi.string().required().min(10).max(500).trim(),
  }),
};

// Handle device change request (admin)
const handleDeviceRequest = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    action: Joi.string().valid("approve", "reject").required(),
    adminNote: Joi.string().max(500).trim(),
  }),
};

module.exports = {
  createStudent,
  bulkCreateStudents,
  updateStudent,
  getStudent,
  bindDevice,
  requestDeviceChange,
  handleDeviceRequest,
};
