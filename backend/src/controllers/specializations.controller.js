const { Specialization } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync } = require("../utils/helpers");

/**
 * Get all specializations
 * GET /api/specializations
 */
exports.getAllSpecializations = catchAsync(async (req, res, next) => {
  const specializations = await Specialization.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: specializations.length,
    data: specializations,
  });
});

/**
 * Get all unique faculties
 * GET /api/specializations/faculties
 */
exports.getFaculties = catchAsync(async (req, res, next) => {
  const faculties = await Specialization.distinct("faculty");
  res.status(200).json({
    success: true,
    data: faculties,
  });
});

/**
 * Get single specialization
 * GET /api/specializations/:id
 */
exports.getSpecialization = catchAsync(async (req, res, next) => {
  const specialization = await Specialization.findById(req.params.id);

  if (!specialization) {
    throw ApiError.notFound("Specialization not found");
  }

  res.status(200).json({
    success: true,
    data: specialization,
  });
});

/**
 * Create specialization
 * POST /api/specializations
 */
exports.createSpecialization = catchAsync(async (req, res, next) => {
  const specialization = await Specialization.create(req.body);

  res.status(201).json({
    success: true,
    data: specialization,
  });
});

/**
 * Update specialization
 * PUT /api/specializations/:id
 */
exports.updateSpecialization = catchAsync(async (req, res, next) => {
  const specialization = await Specialization.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );

  if (!specialization) {
    throw ApiError.notFound("Specialization not found");
  }

  res.status(200).json({
    success: true,
    data: specialization,
  });
});

/**
 * Delete specialization
 * DELETE /api/specializations/:id
 */
exports.deleteSpecialization = catchAsync(async (req, res, next) => {
  const specialization = await Specialization.findByIdAndDelete(req.params.id);

  if (!specialization) {
    throw ApiError.notFound("Specialization not found");
  }

  res.status(200).json({
    success: true,
    message: "Specialization deleted successfully",
  });
});
