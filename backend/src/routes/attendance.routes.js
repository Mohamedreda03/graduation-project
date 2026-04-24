const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { protect, adminOrDoctor, studentOnly } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /attendance/my/status:
 *   get:
 *     summary: Get current lecture status for polling (Student only)
 *     description: Returns whether the student is currently in a lecture. Flutter app should poll this every 30-60 seconds.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current lecture status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     inLecture:
 *                       type: boolean
 *                     session:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         hallName:
 *                           type: string
 *                         courseName:
 *                           type: string
 *                         courseCode:
 *                           type: string
 *                         doctorName:
 *                           type: string
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *                         connectedAt:
 *                           type: string
 *                           format: date-time
 *                         attendanceStatus:
 *                           type: string
 *                           enum: [in-progress, present, absent, late, excused]
 *                         presenceTimeMinutes:
 *                           type: integer
 */
router.get("/my/status", studentOnly, attendanceController.getMyLectureStatus);

/**
 * @swagger
 * /attendance/my:
 *   get:
 *     summary: Get my attendance records (Student only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Student's attendance records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 */
router.get("/my", studentOnly, attendanceController.getMyAttendance);

/**
 * @swagger
 * /attendance/my/course/{courseId}:
 *   get:
 *     summary: Get my attendance for a specific course (Student only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance summary for the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalLectures:
 *                           type: integer
 *                         presentLectures:
 *                           type: integer
 *                         absentLectures:
 *                           type: integer
 *                         attendancePercentage:
 *                           type: number
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AttendanceRecord'
 */
router.get(
  "/my/course/:courseId",
  studentOnly,
  attendanceController.getMyAttendanceForCourse,
);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get all attendance records (Admin/Doctor)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in-progress, present, absent]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get("/", adminOrDoctor, attendanceController.getAllAttendance);

/**
 * @swagger
 * /attendance/lecture/{lectureId}:
 *   get:
 *     summary: Get attendance for a specific lecture (Admin/Doctor)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lectureId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Defaults to today
 *     responses:
 *       200:
 *         description: Attendance records for the lecture
 */
router.get(
  "/lecture/:lectureId",
  adminOrDoctor,
  attendanceController.getLectureAttendance,
);

/**
 * @swagger
 * /attendance/live/{hallId}:
 *   get:
 *     summary: Get live attendance in a hall (Admin/Doctor)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hallId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live attendance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeSessions:
 *                       type: integer
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     inProgressRecords:
 *                       type: integer
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get(
  "/live/:hallId",
  adminOrDoctor,
  attendanceController.getLiveAttendance,
);

/**
 * @swagger
 * /attendance/daily-summary:
 *   get:
 *     summary: Get daily attendance summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/daily-summary",
  adminOrDoctor,
  attendanceController.getDailySummary,
);

/**
 * @swagger
 * /attendance/weekly-summary:
 *   get:
 *     summary: Get weekly attendance summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/weekly-summary",
  adminOrDoctor,
  attendanceController.getWeeklySummary,
);

/**
 * @swagger
 * /attendance/course/{courseId}/report:
 *   get:
 *     summary: Get course attendance report
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/course/:courseId/report",
  adminOrDoctor,
  attendanceController.getCourseAttendanceReport,
);

/**
 * @swagger
 * /attendance/course/{courseId}/export:
 *   get:
 *     summary: Export course attendance report
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/course/:courseId/export",
  adminOrDoctor,
  attendanceController.exportAttendanceReport,
);

/**
 * @swagger
 * /attendance/at-risk:
 *   get:
 *     summary: Get students at risk of failing due to low attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get("/at-risk", adminOrDoctor, attendanceController.getAtRiskStudents);

/**
 * @swagger
 * /attendance/{id}:
 *   put:
 *     summary: Update attendance status (Admin/Doctor)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", adminOrDoctor, attendanceController.updateAttendanceStatus);

/**
 * @swagger
 * /attendance/{id}/excuse:
 *   put:
 *     summary: Mark attendance as excused (Admin/Doctor)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id/excuse", adminOrDoctor, attendanceController.markExcused);

module.exports = router;
