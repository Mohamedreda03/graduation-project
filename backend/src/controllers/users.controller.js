const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync, paginationResponse } = require("../utils/helpers");

/**
 * Get current user
 * GET /api/users/me
 */
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate("academicInfo.department")
    .populate("academicInfo.enrolledCourses");

  // Format user data for frontend
  const userData = {
    _id: user._id,
    email: user.email,
    name: user.fullName, // استخدام fullName virtual
    role: user.role,
    studentId: user.studentId,
    phone: user.phone,
    isActive: user.isActive,
    academicInfo: user.academicInfo,
    device: user.device,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(200).json({
    success: true,
    data: userData,
  });
});

/**
 * Get all users
 * GET /api/users
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { "name.first": { $regex: search, $options: "i" } },
      { "name.last": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate("academicInfo.department")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(users, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get single user
 * GET /api/users/:id
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate("academicInfo.department")
    .populate("academicInfo.enrolledCourses");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Create user
 * POST /api/users
 */
exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  // Don't allow password update through this route
  delete req.body.password;
  delete req.body.device;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Delete (deactivate) user
 * DELETE /api/users/:id
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
});
