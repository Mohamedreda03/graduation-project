const {
  AttendanceRecord,
  StudentSession,
  Course,
  User,
  Lecture,
} = require("../models");
const mongoose = require("mongoose");

const { ROLES, ATTENDANCE_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const {
  catchAsync,
  paginationResponse,
  getTodayDate,
} = require("../utils/helpers");

/**
 * Get all attendance records
 * GET /api/attendance
 */
exports.getAllAttendance = catchAsync(async (req, res, next) => {
  const { course, date, status, student, page = 1, limit = 50 } = req.query;

  const query = {};

  // Filter by course for doctors
  if (req.user.role === ROLES.DOCTOR) {
    const doctorCourses = await Course.find({ doctor: req.user._id });
    query.course = { $in: doctorCourses.map((c) => c._id) };
  }

  if (course) query.course = course;
  if (status) query.status = status;
  if (student) query.student = student;

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
    .populate("course", "name code")
    .populate("lecture", "startTime endTime")
    .populate("hall", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(records, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get my attendance (for students)
 * GET /api/attendance/my
 */
exports.getMyAttendance = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  const query = { student: req.user._id };

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
 * Get my attendance for a specific course
 * GET /api/attendance/my/course/:courseId
 */
exports.getMyAttendanceForCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const records = await AttendanceRecord.find({
    student: req.user._id,
    course: courseId,
    isFinalized: true,
  })
    .populate("lecture", "startTime endTime dayOfWeek")
    .sort({ date: -1 });

  const course = await Course.findById(courseId).select("name code");

  const totalLectures = records.length;
  const presentLectures = records.filter(
    (r) => r.status === ATTENDANCE_STATUS.PRESENT,
  ).length;

  res.status(200).json({
    success: true,
    data: {
      course,
      summary: {
        totalLectures,
        presentLectures,
        absentLectures: totalLectures - presentLectures,
        attendancePercentage:
          totalLectures > 0
            ? Math.round((presentLectures / totalLectures) * 100)
            : 0,
      },
      records,
    },
  });
});

/**
 * Get attendance for a specific lecture
 * GET /api/attendance/lecture/:lectureId
 */
exports.getLectureAttendance = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const { date } = req.query;

  const query = { lecture: lectureId };

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  } else {
    // Default to today
    query.date = getTodayDate();
  }

  const records = await AttendanceRecord.find(query)
    .populate("student", "studentId name")
    .sort({ "student.studentId": 1 });

  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

/**
 * Get live attendance (students currently in hall)
 * GET /api/attendance/live/:hallId
 */
exports.getLiveAttendance = catchAsync(async (req, res, next) => {
  const { hallId } = req.params;

  // Get active sessions in this hall
  const sessions = await StudentSession.find({
    currentHall: hallId,
    isActive: true,
  }).populate("student", "studentId name");

  // Also get in-progress attendance records
  const today = getTodayDate();
  const records = await AttendanceRecord.find({
    hall: hallId,
    date: today,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  }).populate("student", "studentId name");

  res.status(200).json({
    success: true,
    data: {
      activeSessions: sessions.length,
      sessions: sessions.map((s) => ({
        student: s.student,
        connectedAt: s.connectedAt,
        macAddress: s.macAddress,
      })),
      inProgressRecords: records.length,
      records: records.map((r) => ({
        student: r.student,
        checkIn: r.sessions[r.sessions.length - 1]?.checkIn,
        totalTime: r.totalPresenceTime,
      })),
    },
  });
});

/**
 * Get students at risk (attendance below threshold)
 * GET /api/attendance/at-risk
 */
exports.getAtRiskStudents = catchAsync(async (req, res, next) => {
  const { course: courseId, threshold = 75 } = req.query;

  const matchStage = { isFinalized: true };
  if (
    courseId &&
    courseId !== "all" &&
    mongoose.Types.ObjectId.isValid(courseId)
  ) {
    matchStage.course = new mongoose.Types.ObjectId(courseId);
  }

  // If doctor, only their courses
  if (req.user.role === ROLES.DOCTOR) {
    const doctorCourses = await Course.find({ doctor: req.user._id }).select(
      "_id",
    );
    matchStage.course = { $in: doctorCourses.map((c) => c._id) };
  }

  const atRiskData = await AttendanceRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { student: "$student", course: "$course" },
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
          },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        student: "$_id.student",
        course: "$_id.course",
        total: 1,
        present: 1,
        absent: 1,
        attendanceRate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    { $match: { attendanceRate: { $lt: parseFloat(threshold) } } },
    { $sort: { attendanceRate: 1 } },
    { $limit: 50 },
  ]);

  // Populate student and course info
  const studentIds = atRiskData.map((d) => d.student);
  const courseIds = atRiskData.map((d) => d.course);

  const [students, courses] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select(
      "name studentId academicInfo",
    ),
    Course.find({ _id: { $in: courseIds } }).select("name code"),
  ]);

  const studentsMap = {};
  students.forEach((s) => {
    studentsMap[s._id.toString()] = s;
  });

  const coursesMap = {};
  courses.forEach((c) => {
    coursesMap[c._id.toString()] = c;
  });

  const result = atRiskData.map((d) => ({
    student: studentsMap[d.student.toString()] || {
      name: "غير معروف",
      studentId: "-",
    },
    course: coursesMap[d.course.toString()] || {
      name: "غير معروف",
      code: "-",
    },
    totalLectures: d.total,
    present: d.present,
    absent: d.absent,
    attendanceRate: Math.round(d.attendanceRate * 10) / 10,
  }));

  res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * Update attendance status
 * PUT /api/attendance/:id
 */
exports.updateAttendanceStatus = catchAsync(async (req, res, next) => {
  const { status, reason } = req.body;

  if (!status || !["present", "absent", "late", "excused"].includes(status)) {
    throw ApiError.badRequest(
      "Valid status is required (present, absent, late, excused)",
    );
  }

  const record = await AttendanceRecord.findById(req.params.id);
  if (!record) {
    throw ApiError.notFound("Attendance record not found");
  }

  record.status = status;
  if (reason) record.modificationReason = reason;
  record.modifiedBy = req.user._id;
  record.modifiedAt = new Date();
  await record.save();

  const populatedRecord = await AttendanceRecord.findById(record._id)
    .populate("student", "studentId name")
    .populate("course", "name code")
    .populate("lecture", "startTime endTime");

  res.status(200).json({
    success: true,
    data: populatedRecord,
  });
});

/**
 * Mark student as excused
 * PUT /api/attendance/:id/excuse
 */
exports.markExcused = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    throw ApiError.badRequest("Reason is required");
  }

  const record = await AttendanceRecord.findById(req.params.id);
  if (!record) {
    throw ApiError.notFound("Attendance record not found");
  }

  record.status = "excused";
  record.modificationReason = reason;
  record.modifiedBy = req.user._id;
  record.modifiedAt = new Date();
  await record.save();

  const populatedRecord = await AttendanceRecord.findById(record._id)
    .populate("student", "studentId name")
    .populate("course", "name code");

  res.status(200).json({
    success: true,
    data: populatedRecord,
  });
});

/**
 * Get course attendance report
 * GET /api/attendance/course/:courseId/report
 */
exports.getCourseAttendanceReport = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const course = await Course.findById(courseId).select("name code students");

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const total = course.students.length;
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedStudentIds = course.students.slice(startIndex, endIndex);

  const students = [];
  for (const studentId of paginatedStudentIds) {
    const student = await User.findById(studentId).select("studentId name");
    if (!student) continue;

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

    const absentRecords = totalRecords - presentRecords;
    const attendanceRate =
      totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    students.push({
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
      },
      stats: {
        totalLectures: totalRecords,
        present: presentRecords,
        absent: absentRecords,
        attendanceRate,
      },
      isAtRisk: attendanceRate < 75,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      course: {
        _id: course._id,
        name: course.name,
        code: course.code,
      },
      ...paginationResponse(students, total, parseInt(page), parseInt(limit)),
    },
  });
});

/**
 * Export attendance report
 * GET /api/attendance/course/:courseId/export
 */
exports.exportAttendanceReport = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { format = "csv" } = req.query;

  const course = await Course.findById(courseId)
    .populate("students", "studentId name")
    .select("name code students");

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // Build CSV data
  let csvContent =
    "Student ID,Name,Total Lectures,Present,Absent,Attendance Rate\n";

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

    const absentRecords = totalRecords - presentRecords;
    const rate =
      totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    const name =
      `${student.name?.first || ""} ${student.name?.last || ""}`.trim();
    csvContent += `${student.studentId},"${name}",${totalRecords},${presentRecords},${absentRecords},${rate}%\n`;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${course.code}_attendance.csv"`,
  );
  res.status(200).send(csvContent);
});

/**
 * Get daily attendance summary
 * GET /api/attendance/daily-summary?date=2024-01-15
 */
exports.getDailySummary = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    date: { $gte: startOfDay, $lte: endOfDay },
    isFinalized: true,
  };

  // Filter by doctor's courses if not admin
  if (req.user.role === ROLES.DOCTOR) {
    const doctorCourses = await Course.find({ doctor: req.user._id });
    query.course = { $in: doctorCourses.map((c) => c._id) };
  }

  const totalRecords = await AttendanceRecord.countDocuments(query);
  const presentRecords = await AttendanceRecord.countDocuments({
    ...query,
    status: "present",
  });
  const absentRecords = await AttendanceRecord.countDocuments({
    ...query,
    status: "absent",
  });

  res.status(200).json({
    success: true,
    data: {
      date: targetDate.toISOString().split("T")[0],
      total: totalRecords,
      present: presentRecords,
      absent: absentRecords,
      attendanceRate:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    },
  });
});

/**
 * Get weekly attendance summary
 * GET /api/attendance/weekly-summary?startDate=2024-01-15
 */
exports.getWeeklySummary = catchAsync(async (req, res, next) => {
  const { startDate } = req.query;

  const weekStart = startDate ? new Date(startDate) : new Date();
  weekStart.setHours(0, 0, 0, 0);
  // Go back to Sunday
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const query = {
    date: { $gte: weekStart, $lte: weekEnd },
    isFinalized: true,
  };

  // Filter by doctor's courses if not admin
  if (req.user.role === ROLES.DOCTOR) {
    const doctorCourses = await Course.find({ doctor: req.user._id });
    query.course = { $in: doctorCourses.map((c) => c._id) };
  }

  // Get daily breakdown
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(weekStart);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayQuery = { ...query, date: { $gte: dayStart, $lte: dayEnd } };
    const total = await AttendanceRecord.countDocuments(dayQuery);
    const present = await AttendanceRecord.countDocuments({
      ...dayQuery,
      status: "present",
    });

    dailyData.push({
      date: dayStart.toISOString().split("T")[0],
      dayOfWeek: i,
      total,
      present,
      absent: total - present,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  }

  const totalAll = dailyData.reduce((sum, d) => sum + d.total, 0);
  const presentAll = dailyData.reduce((sum, d) => sum + d.present, 0);

  res.status(200).json({
    success: true,
    data: {
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      total: totalAll,
      present: presentAll,
      absent: totalAll - presentAll,
      attendanceRate:
        totalAll > 0 ? Math.round((presentAll / totalAll) * 100) : 0,
      daily: dailyData,
    },
  });
});

/**
 * Get my current lecture status (for polling from Flutter)
 * GET /api/attendance/my/status
 */
exports.getMyLectureStatus = catchAsync(async (req, res, next) => {
  // 1. Find active session for this student
  const session = await StudentSession.findActiveSession(req.user._id);

  if (!session || !session.currentLecture) {
    return res.status(200).json({
      success: true,
      data: {
        inLecture: false,
        session: null,
      },
    });
  }

  // 2. Populate lecture details with course, hall, and doctor
  const lecture = await Lecture.findById(session.currentLecture)
    .populate("course", "name code")
    .populate("hall", "name")
    .populate("doctor", "name");

  if (!lecture) {
    return res.status(200).json({
      success: true,
      data: {
        inLecture: false,
        session: null,
      },
    });
  }

  // 3. Get attendance record for presence time
  let presenceTimeMinutes = 0;
  let attendanceStatus = ATTENDANCE_STATUS.IN_PROGRESS;

  if (session.attendanceRecord) {
    const record = await AttendanceRecord.findById(session.attendanceRecord);
    if (record) {
      attendanceStatus = record.status;
      // Calculate live presence time from sessions
      let totalMinutes = 0;
      for (const s of record.sessions) {
        const checkIn = new Date(s.checkIn);
        const checkOut = s.checkOut ? new Date(s.checkOut) : new Date();
        totalMinutes += Math.max(0, (checkOut - checkIn) / (1000 * 60));
      }
      presenceTimeMinutes = Math.round(totalMinutes);
    }
  }

  // 4. Build doctor name
  const doctorName = lecture.doctor
    ? `${lecture.doctor.name?.first || ""} ${lecture.doctor.name?.last || ""}`.trim()
    : "";

  res.status(200).json({
    success: true,
    data: {
      inLecture: true,
      session: {
        hallName: lecture.hall?.name || "",
        courseName: lecture.course?.name || "",
        courseCode: lecture.course?.code || "",
        doctorName,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        connectedAt: session.connectedAt,
        attendanceStatus,
        presenceTimeMinutes,
      },
    },
  });
});
