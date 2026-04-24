const { Hall } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync } = require("../utils/helpers");
const crypto = require("crypto");

/**
 * Get all halls
 * GET /api/halls
 */
exports.getAllHalls = catchAsync(async (req, res, next) => {
  const halls = await Hall.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: halls.length,
    data: halls,
  });
});

/**
 * Get single hall
 * GET /api/halls/:id
 */
exports.getHall = catchAsync(async (req, res, next) => {
  const hall = await Hall.findById(req.params.id);

  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  res.status(200).json({
    success: true,
    data: hall,
  });
});

/**
 * Create hall
 * POST /api/halls
 */
exports.createHall = catchAsync(async (req, res, next) => {
  // Generate API key for this hall's access point
  const apiKey = crypto.randomBytes(32).toString("hex");

  const hallData = {
    ...req.body,
    accessPoint: {
      ...req.body.accessPoint,
      apiKey,
    },
  };

  const hall = await Hall.create(hallData);

  res.status(201).json({
    success: true,
    data: hall,
  });
});

/**
 * Update hall
 * PUT /api/halls/:id
 */
exports.updateHall = catchAsync(async (req, res, next) => {
  // Don't allow direct update of accessPoint through this route
  delete req.body.accessPoint;

  const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  res.status(200).json({
    success: true,
    data: hall,
  });
});

/**
 * Delete hall
 * DELETE /api/halls/:id
 */
exports.deleteHall = catchAsync(async (req, res, next) => {
  const hall = await Hall.findByIdAndDelete(req.params.id);

  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  res.status(200).json({
    success: true,
    message: "Hall deleted successfully",
  });
});

/**
 * Update access point info
 * PUT /api/halls/:id/access-point
 */
exports.updateAccessPoint = catchAsync(async (req, res, next) => {
  const { ssid, ipRange, apIdentifier, regenerateKey } = req.body;

  const hall = await Hall.findById(req.params.id);

  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  if (ssid) hall.accessPoint.ssid = ssid;
  if (ipRange) hall.accessPoint.ipRange = ipRange;
  if (apIdentifier) hall.accessPoint.apIdentifier = apIdentifier;

  if (regenerateKey) {
    hall.accessPoint.apiKey = crypto.randomBytes(32).toString("hex");
  }

  await hall.save();

  res.status(200).json({
    success: true,
    data: hall,
  });
});

/**
 * Get hall status
 * GET /api/halls/:id/status
 */
exports.getHallStatus = catchAsync(async (req, res, next) => {
  const hall = await Hall.findById(req.params.id);

  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  res.status(200).json({
    success: true,
    data: {
      hall: {
        id: hall._id,
        name: hall.name,
      },
      accessPoint: {
        ssid: hall.accessPoint.ssid,
        ipRange: hall.accessPoint.ipRange,
        lastSeen: hall.accessPoint.lastSeen,
      },
    },
  });
});
