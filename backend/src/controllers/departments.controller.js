const { Department } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync } = require("../utils/helpers");

/**
 * Get all departments
 * GET /api/departments
 */
exports.getAllDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: departments.length,
    data: departments,
  });
});

/**
 * Get single department
 * GET /api/departments/:id
 */
exports.getDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  res.status(200).json({
    success: true,
    data: department,
  });
});

/**
 * Create department
 * POST /api/departments
 */
exports.createDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.create(req.body);

  res.status(201).json({
    success: true,
    data: department,
  });
});

/**
 * Update department
 * PUT /api/departments/:id
 */
exports.updateDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  res.status(200).json({
    success: true,
    data: department,
  });
});

/**
 * Delete department
 * DELETE /api/departments/:id
 */
exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndDelete(req.params.id);

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
  });
});
