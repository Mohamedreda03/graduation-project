const Joi = require("joi");
const { CONNECTION_EVENTS } = require("../config/constants");

// MAC address pattern
const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

// Connection event from Access Point
const connectionEvent = {
  body: Joi.object({
    eventType: Joi.string()
      .valid(...Object.values(CONNECTION_EVENTS))
      .required(),
    macAddress: Joi.string()
      .pattern(macPattern)
      .required()
      .messages({ "string.pattern.base": "Invalid device MAC address format" }),
    apMacAddress: Joi.string()
      .pattern(macPattern)
      .required()
      .messages({
        "string.pattern.base": "Invalid Access Point MAC address format",
      }),
    timestamp: Joi.date()
      .iso()
      .default(() => new Date()),
    signalStrength: Joi.number().min(-100).max(0),
    additionalInfo: Joi.object(),
  }),
};

// Get connection logs query
const getConnectionLogs = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(500).default(100),
    eventType: Joi.string().valid(...Object.values(CONNECTION_EVENTS)),
    macAddress: Joi.string().pattern(macPattern),
    hallId: Joi.string().hex().length(24),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")),
  }),
};

// Get hall connection logs
const getHallConnectionLogs = {
  params: Joi.object({
    hallId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(200).default(50),
    date: Joi.date().iso(),
  }),
};

// Reprocess log
const reprocessLog = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  connectionEvent,
  getConnectionLogs,
  getHallConnectionLogs,
  reprocessLog,
};
