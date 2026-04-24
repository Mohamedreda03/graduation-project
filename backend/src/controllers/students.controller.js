const { User, AttendanceRecord, Course } = require("../models");
const { ROLES, DEVICE_REQUEST_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, paginationResponse } = require("../utils/helpers");

/**
 * Get student statistics
 * GET /api/students/stats
 */
exports.getStudentStats = catchAsync(async (req, res, next) => {
  const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });

  const levelStats = await User.aggregate([
    { $match: { role: ROLES.STUDENT } },
    {
      $group: {
        _id: "$academicInfo.level",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Format level stats into a simple object
  const levelCounts = {};
  // Initialize with 0 for levels 1-4
  [1, 2, 3, 4].forEach((l) => (levelCounts[l] = 0));
  levelStats.forEach((stat) => {
    if (stat._id) levelCounts[stat._id] = stat.count;
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalStudents,
      levels: levelCounts,
    },
  });
});

/**
 * Get all students
 * GET /api/students
 */
exports.getAllStudents = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, department, level, search } = req.query;

  const query = { role: ROLES.STUDENT };

  if (department) {
    query["academicInfo.department"] = department;
  }

  if (level) {
    query["academicInfo.level"] = parseInt(level);
  }

  if (search) {
    query.$or = [
      { "name.first": { $regex: search, $options: "i" } },
      { "name.last": { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const students = await User.find(query)
    .populate("academicInfo.department")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ studentId: 1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(students, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get single student
 * GET /api/students/:id
 */
exports.getStudent = catchAsync(async (req, res, next) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: ROLES.STUDENT,
  })
    .populate("academicInfo.department")
    .populate("academicInfo.enrolledCourses");

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

/**
 * Create student
 * POST /api/students
 */
exports.createStudent = catchAsync(async (req, res, next) => {
  const studentData = {
    ...req.body,
    role: ROLES.STUDENT,
  };

  const student = await User.create(studentData);

  res.status(201).json({
    success: true,
    data: student,
  });
});

/**
 * Create students in bulk
 * POST /api/students/bulk
 */
exports.createStudentsBulk = catchAsync(async (req, res, next) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const studentData of students) {
    try {
      const student = await User.create({
        ...studentData,
        role: ROLES.STUDENT,
      });
      results.success.push({
        studentId: student.studentId,
        name: student.fullName,
      });
    } catch (error) {
      results.failed.push({
        studentId: studentData.studentId,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    data: results,
  });
});

/**
 * Update student
 * PUT /api/students/:id
 */
exports.updateStudent = catchAsync(async (req, res, next) => {
  // Don't allow certain fields to be updated
  delete req.body.role;

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.STUDENT },
    req.body,
    { new: true, runValidators: true },
  );

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

/**
 * Get student attendance
 * GET /api/students/:id/attendance
 */
exports.getStudentAttendance = catchAsync(async (req, res, next) => {
  const { courseId, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { student: req.params.id };

  if (courseId) {
    query.course = courseId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const total = await AttendanceRecord.countDocuments(query);
  const records = await AttendanceRecord.find(query)
    .populate("course", "name code")
    .populate("lecture", "startTime endTime dayOfWeek")
    .populate("hall", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(records, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get student attendance summary
 * GET /api/students/:id/attendance-summary
 */
exports.getStudentAttendanceSummary = catchAsync(async (req, res, next) => {
  const studentId = req.params.id;

  const student = await User.findById(studentId);
  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  // Get enrolled courses
  const courses = await Course.find({
    students: studentId,
  }).populate("doctor", "name");

  const summary = [];

  for (const course of courses) {
    const totalRecords = await AttendanceRecord.countDocuments({
      student: studentId,
      course: course._id,
      isFinalized: true,
    });

    const presentRecords = await AttendanceRecord.countDocuments({
      student: studentId,
      course: course._id,
      isFinalized: true,
      status: "present",
    });

    summary.push({
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        doctor: course.doctor?.name,
      },
      totalLectures: totalRecords,
      attendedLectures: presentRecords,
      attendancePercentage:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
      },
      summary,
    },
  });
});

/**
 * Get my device info
 * GET /api/students/my-device
 */
exports.getMyDevice = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      device: user.device,
      hasDeviceChangeRequest: user.deviceChangeRequest?.requested,
      deviceChangeRequest: user.deviceChangeRequest,
    },
  });
});

/**
 * Request device change
 * POST /api/students/request-device-change
 */
exports.requestDeviceChange = catchAsync(async (req, res, next) => {
  const { reason, newDeviceInfo } = req.body;

  if (!reason) {
    throw ApiError.badRequest("Reason is required");
  }

  if (!newDeviceInfo || !newDeviceInfo.macAddress) {
    throw ApiError.badRequest("New device info is required");
  }

  const user = await User.findById(req.user._id);

  if (
    user.deviceChangeRequest?.requested &&
    user.deviceChangeRequest.status === DEVICE_REQUEST_STATUS.PENDING
  ) {
    throw ApiError.badRequest(
      "You already have a pending device change request",
    );
  }

  user.deviceChangeRequest = {
    requested: true,
    requestedAt: new Date(),
    reason,
    newDeviceInfo,
    status: DEVICE_REQUEST_STATUS.PENDING,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change request submitted successfully",
  });
});

/**
 * Get device change requests
 * GET /api/students/device-requests
 */
exports.getDeviceChangeRequests = catchAsync(async (req, res, next) => {
  const {
    status = DEVICE_REQUEST_STATUS.PENDING,
    page = 1,
    limit = 10,
  } = req.query;

  const query = {
    role: ROLES.STUDENT,
    "deviceChangeRequest.requested": true,
  };

  if (status) {
    query["deviceChangeRequest.status"] = status;
  }

  const total = await User.countDocuments(query);
  const requests = await User.find(query)
    .select("studentId name email device deviceChangeRequest")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ "deviceChangeRequest.requestedAt": -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(requests, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Approve device change
 * POST /api/students/device-requests/:id/approve
 */
exports.approveDeviceChange = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.deviceChangeRequest?.requested) {
    throw ApiError.badRequest("No device change request found");
  }

  // Update device with new info
  user.device = {
    ...user.deviceChangeRequest.newDeviceInfo,
    registeredAt: new Date(),
    isVerified: true,
  };

  user.deviceChangeRequest = {
    requested: false,
    status: DEVICE_REQUEST_STATUS.APPROVED,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change approved successfully",
  });
});

/**
 * Reject device change
 * POST /api/students/device-requests/:id/reject
 */
exports.rejectDeviceChange = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.deviceChangeRequest?.requested) {
    throw ApiError.badRequest("No device change request found");
  }

  user.deviceChangeRequest = {
    requested: false,
    status: DEVICE_REQUEST_STATUS.REJECTED,
    reason: reason || "Request rejected by admin",
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change rejected",
  });
});
