const { Course, User, AttendanceRecord } = require("../models");
const { ROLES } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, paginationResponse } = require("../utils/helpers");

/**
 * Get all courses
 * GET /api/courses
 */
exports.getAllCourses = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    department,
    level,
    semester,
    doctor,
    search,
  } = req.query;

  const query = { isActive: true };

  if (department) query.department = department;
  if (level) query.level = parseInt(level);
  if (semester) query.semester = semester;
  if (doctor) query.doctor = doctor;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate("department", "name code")
    .populate("doctor", "name email")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ code: 1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(courses, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get single course
 * GET /api/courses/:id
 */
exports.getCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate("department", "name code")
    .populate("doctor", "name email");

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * Create course
 * POST /api/courses
 */
exports.createCourse = catchAsync(async (req, res, next) => {
  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course,
  });
});

/**
 * Update course
 * PUT /api/courses/:id
 */
exports.updateCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * Delete (deactivate) course
 * DELETE /api/courses/:id
 */
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  res.status(200).json({
    success: true,
    message: "Course deactivated successfully",
  });
});

/**
 * Get course students
 * GET /api/courses/:id/students
 */
exports.getCourseStudents = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "students",
    select: "studentId name email academicInfo",
    populate: { path: "academicInfo.department", select: "name" },
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  res.status(200).json({
    success: true,
    count: course.students.length,
    data: course.students,
  });
});

/**
 * Add students to course
 * POST /api/courses/:id/students
 */
exports.addStudentsToCourse = catchAsync(async (req, res, next) => {
  // Accept both `students` (frontend) and `studentIds` (legacy)
  const studentIds = req.body.students || req.body.studentIds;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest("Student IDs array is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // Add students to course
  const newStudents = studentIds.filter((id) => !course.students.includes(id));
  course.students.push(...newStudents);
  await course.save();

  // Also add course to students' enrolled courses
  await User.updateMany(
    { _id: { $in: newStudents } },
    { $addToSet: { "academicInfo.enrolledCourses": course._id } },
  );

  res.status(200).json({
    success: true,
    message: `${newStudents.length} students added to course`,
    data: { addedCount: newStudents.length },
  });
});

/**
 * Remove student from course
 * DELETE /api/courses/:id/students/:studentId
 */
exports.removeStudentFromCourse = catchAsync(async (req, res, next) => {
  const { id, studentId } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  course.students = course.students.filter((s) => s.toString() !== studentId);
  await course.save();

  // Also remove course from student's enrolled courses
  await User.findByIdAndUpdate(studentId, {
    $pull: { "academicInfo.enrolledCourses": course._id },
  });

  res.status(200).json({
    success: true,
    message: "Student removed from course",
  });
});

/**
 * Get course attendance
 * GET /api/courses/:id/attendance
 */
exports.getCourseAttendance = catchAsync(async (req, res, next) => {
  const { date, page = 1, limit = 50 } = req.query;

  const query = { course: req.params.id };
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const total = await AttendanceRecord.countDocuments(query);
  const records = await AttendanceRecord.find(query)
    .populate("student", "studentId name")
    .populate("lecture", "startTime endTime dayOfWeek")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ date: -1, "student.studentId": 1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(records, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get course attendance report
 * GET /api/courses/:id/attendance-report
 */
exports.getCourseAttendanceReport = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;

  const course = await Course.findById(courseId)
    .populate("students", "studentId name")
    .populate("doctor", "name");

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const report = [];

  for (const student of course.students) {
    const totalRecords = await AttendanceRecord.countDocuments({
      student: student._id,
      course: courseId,
      isFinalized: true,
    });

    const presentRecords = await AttendanceRecord.countDocuments({
      student: student._id,
      course: courseId,
      isFinalized: true,
      status: "present",
    });

    report.push({
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
      },
      totalLectures: totalRecords,
      attendedLectures: presentRecords,
      attendancePercentage:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    });
  }

  // Sort by attendance percentage
  report.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  res.status(200).json({
    success: true,
    data: {
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        doctor: course.doctor?.name,
      },
      totalStudents: course.students.length,
      report,
    },
  });
});

/**
 * Enroll students to course (alias for addStudentsToCourse with frontend-compatible body)
 * POST /api/courses/:id/enroll
 */
exports.enrollStudents = catchAsync(async (req, res, next) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const newStudents = students.filter((id) => !course.students.includes(id));
  course.students.push(...newStudents);
  await course.save();

  await User.updateMany(
    { _id: { $in: newStudents } },
    { $addToSet: { "academicInfo.enrolledCourses": course._id } },
  );

  res.status(200).json({
    success: true,
    message: `${newStudents.length} students enrolled in course`,
    data: { enrolled: newStudents.length },
  });
});

/**
 * Unenroll students from course
 * POST /api/courses/:id/unenroll
 */
exports.unenrollStudents = catchAsync(async (req, res, next) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  course.students = course.students.filter(
    (s) => !students.includes(s.toString()),
  );
  await course.save();

  await User.updateMany(
    { _id: { $in: students } },
    { $pull: { "academicInfo.enrolledCourses": course._id } },
  );

  res.status(200).json({
    success: true,
    message: `Students unenrolled from course`,
  });
});

/**
 * Enroll students by level
 * POST /api/courses/:id/enroll-by-level
 */
exports.enrollByLevel = catchAsync(async (req, res, next) => {
  const { level } = req.body;

  if (!level) {
    throw ApiError.badRequest("Level is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // Find all students at this level
  const studentsAtLevel = await User.find({
    role: ROLES.STUDENT,
    "academicInfo.level": parseInt(level),
    isActive: true,
  }).select("_id");

  const studentIds = studentsAtLevel.map((s) => s._id);
  const newStudents = studentIds.filter(
    (id) => !course.students.some((s) => s.toString() === id.toString()),
  );

  course.students.push(...newStudents);
  await course.save();

  await User.updateMany(
    { _id: { $in: newStudents } },
    { $addToSet: { "academicInfo.enrolledCourses": course._id } },
  );

  res.status(200).json({
    success: true,
    data: { enrolled: newStudents.length },
  });
});

/**
 * Get course attendance stats
 * GET /api/courses/:id/attendance-stats
 */
exports.getCourseAttendanceStats = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;

  const course = await Course.findById(courseId).select("name code students");
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const totalRecords = await AttendanceRecord.countDocuments({
    course: courseId,
    isFinalized: true,
  });

  const presentRecords = await AttendanceRecord.countDocuments({
    course: courseId,
    isFinalized: true,
    status: "present",
  });

  const absentRecords = await AttendanceRecord.countDocuments({
    course: courseId,
    isFinalized: true,
    status: "absent",
  });

  res.status(200).json({
    success: true,
    data: {
      totalStudents: course.students.length,
      totalRecords,
      present: presentRecords,
      absent: absentRecords,
      attendanceRate:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    },
  });
});
