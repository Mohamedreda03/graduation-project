const ApiError = require("../utils/ApiError");
const { Hall } = require("../models");
const config = require("../config/env");
const { catchAsync } = require("../utils/helpers");

/**
 * Verify request is from a valid Access Point
 */
const verifyAccessPoint = catchAsync(async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    throw ApiError.unauthorized("API key is required");
  }

  // Check if it's the global AP key
  if (apiKey === config.apApiKey) {
    // Try to find hall by apIdentifier from request body
    const { apIdentifier } = req.body;
    if (apIdentifier) {
      const hall = await Hall.findOne({
        "accessPoint.apIdentifier": apIdentifier,
      });
      if (hall) {
        req.hall = hall;
        // Update AP status
        await hall.updateApStatus(true);
      }
    }
    next();
    return;
  }

  // Check if it's a hall-specific key
  const hall = await Hall.findOne({ "accessPoint.apiKey": apiKey });

  if (!hall) {
    throw ApiError.unauthorized("Invalid API key");
  }

  // Attach hall to request for later use
  req.hall = hall;

  // Update AP status
  await hall.updateApStatus(true);

  next();
});

module.exports = { verifyAccessPoint };
