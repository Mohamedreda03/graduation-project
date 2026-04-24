const { Student, Doctor, Course, Department, Hall, Lecture, AttendanceRecord, User } = require("../models");
const { catchAsync, getTodayDate } = require("../utils/helpers");
const { ROLES } = require("../config/constants");

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 */
exports.getStats = catchAsync(async (req, res, next) => {
  // Get counts
  const [
    totalStudents,
    totalDoctors,
    totalCourses,
    totalDepartments,
    totalHalls,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.DOCTOR }),
    Course.countDocuments(),
    Department.countDocuments(),
    Hall.countDocuments({ isActive: true }),
  ]);

  // Get today's lectures
  const today = new Date();
  const dayOfWeek = today.getDay();

  const todayLectures = await Lecture.countDocuments({
    dayOfWeek,
    isActive: true,
  });

  // Get today's attendance stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAttendance = await AttendanceRecord.aggregate([
    {
      $match: {
        date: { $gte: todayStart, $lte: todayEnd },
        isFinalized: true,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
        },
      },
    },
  ]);

  const attendanceData = todayAttendance[0] || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  };
  const attendanceRate =
    attendanceData.total > 0
      ? Math.round(
          ((attendanceData.present + attendanceData.late) /
            attendanceData.total) *
            100,
        )
      : 0;

  // Get weekly trend (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyData = await AttendanceRecord.aggregate([
    {
      $match: {
        date: { $gte: weekAgo },
        isFinalized: true,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyTrend = weeklyData.map((day) => ({
    day: day._id,
    present: day.present,
    absent: day.absent,
    rate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0,
  }));

  // Count at-risk students (below 75% attendance)
  const atRiskCount = await AttendanceRecord.aggregate([
    { $match: { isFinalized: true } },
    {
      $group: {
        _id: "$student",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        rate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    { $match: { rate: { $lt: 75 } } },
    { $count: "count" },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalDoctors,
      totalCourses,
      totalDepartments,
      totalHalls,
      activeLectures: todayLectures,
      todayAttendance: {
        present: attendanceData.present + attendanceData.late,
        absent: attendanceData.absent,
        rate: attendanceRate,
      },
      weeklyTrend,
      atRiskStudents: atRiskCount[0]?.count || 0,
    },
  });
});

/**
 * Get system health
 * GET /api/dashboard/health
 */
exports.getSystemHealth = catchAsync(async (req, res, next) => {
  const mongoose = require("mongoose");

  // Check database connection
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "healthy" : dbState === 2 ? "degraded" : "down";

  res.status(200).json({
    success: true,
    data: {
      database: dbStatus,
      scheduler: "running",
      activeConnections:
        mongoose.connection.client?.topology?.s?.servers?.size || 1,
      lastSync: new Date().toISOString(),
    },
  });
});

/**
 * Get recent activities
 * GET /api/dashboard/activities
 */
exports.getRecentActivities = catchAsync(async (req, res, next) => {
  const { limit = 10 } = req.query;

  // Get recent attendance records as activities
  const recentRecords = await AttendanceRecord.find({ isFinalized: true })
    .populate("student", "name studentId")
    .populate("course", "name code")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const activities = recentRecords.map((record) => ({
    type: record.status === "present" ? "attendance" : "absence",
    message: `${record.student?.name || "طالب"} - ${record.course?.name || "مقرر"} (${record.status === "present" ? "حضور" : "غياب"})`,
    timestamp: record.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: activities,
  });
});

/**
 * Get quick stats for header
 * GET /api/dashboard/quick-stats
 */
exports.getQuickStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const [todayLecturesCount, activeStudents] = await Promise.all([
    Lecture.countDocuments({ dayOfWeek, isActive: true }),
    Student.countDocuments({ isActive: true }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayLectures: todayLecturesCount,
      activeStudents,
      date: today.toISOString(),
    },
  });
});
