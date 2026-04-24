const Joi = require("joi");
const ApiError = require("../utils/ApiError");

/**
 * Validate request body against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");
      return next(ApiError.badRequest(messages));
    }

    next();
  };
};

/**
 * Validate request params
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");
      return next(ApiError.badRequest(messages));
    }

    next();
  };
};

/**
 * Validate request query
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");
      return next(ApiError.badRequest(messages));
    }

    next();
  };
};

module.exports = { validate, validateParams, validateQuery };
