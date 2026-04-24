const { User, Course, Lecture } = require("../models");
const { ROLES } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, paginationResponse } = require("../utils/helpers");

/**
 * Get all doctors
 * GET /api/doctors
 */
exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, department, search } = req.query;

  const query = { role: ROLES.DOCTOR };

  if (department) {
    query["academicInfo.department"] = department;
  }

  if (search) {
    query.$or = [
      { "name.first": { $regex: search, $options: "i" } },
      { "name.last": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const doctors = await User.find(query)
    .populate("academicInfo.department")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ "name.first": 1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(doctors, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get single doctor
 * GET /api/doctors/:id
 */
exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await User.findOne({
    _id: req.params.id,
    role: ROLES.DOCTOR,
  }).populate("academicInfo.department");

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(200).json({
    success: true,
    data: doctor,
  });
});

/**
 * Create doctor
 * POST /api/doctors
 */
exports.createDoctor = catchAsync(async (req, res, next) => {
  const doctorData = {
    ...req.body,
    role: ROLES.DOCTOR,
  };

  const doctor = await User.create(doctorData);

  res.status(201).json({
    success: true,
    data: doctor,
  });
});

/**
 * Update doctor
 * PUT /api/doctors/:id
 */
exports.updateDoctor = catchAsync(async (req, res, next) => {
  delete req.body.password;
  delete req.body.role;

  const doctor = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.DOCTOR },
    req.body,
    { new: true, runValidators: true },
  );

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(200).json({
    success: true,
    data: doctor,
  });
});

/**
 * Delete (deactivate) doctor
 * DELETE /api/doctors/:id
 */
exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.DOCTOR },
    { isActive: false },
    { new: true },
  );

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  res.status(200).json({
    success: true,
    message: "Doctor deactivated successfully",
  });
});

/**
 * Get doctor's courses
 * GET /api/doctors/:id/courses
 */
exports.getDoctorCourses = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;

  // Check if user is accessing their own data or is admin
  if (req.user.role !== ROLES.ADMIN && req.user._id.toString() !== doctorId) {
    throw ApiError.forbidden("You can only access your own courses");
  }

  const courses = await Course.find({ doctor: doctorId, isActive: true })
    .populate("department", "name code")
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: courses,
  });
});

/**
 * Get doctor's lectures
 * GET /api/doctors/:id/lectures
 */
exports.getDoctorLectures = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;

  // Check if user is accessing their own data or is admin
  if (req.user.role !== ROLES.ADMIN && req.user._id.toString() !== doctorId) {
    throw ApiError.forbidden("You can only access your own lectures");
  }

  const lectures = await Lecture.find({ doctor: doctorId, isActive: true })
    .populate("course", "name code")
    .populate("hall", "name building")
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json({
    success: true,
    data: lectures,
  });
});

/**
 * Assign courses to a doctor
 * POST /api/doctors/:id/courses
 */
exports.assignCourses = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;
  const { courses: courseIds } = req.body;

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw ApiError.badRequest("Courses array is required");
  }

  // Verify doctor exists
  const doctor = await User.findOne({
    _id: doctorId,
    role: ROLES.DOCTOR,
  });

  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  // Update each course to have this doctor
  const result = await Course.updateMany(
    { _id: { $in: courseIds } },
    { doctor: doctorId },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} courses assigned to doctor`,
    data: { assigned: result.modifiedCount },
  });
});
