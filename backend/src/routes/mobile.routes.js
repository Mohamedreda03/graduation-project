/**
 * Mobile Routes
 * All routes are protected: require valid student JWT token.
 *
 * Base: /api/mobile
 *
 * GET  /home                  → Screen 2 (Home dashboard)
 * GET  /schedule              → Screen 3 (Weekly schedule)
 * GET  /attendance/summary    → Screen 4 (Attendance rate circular progress)
 * GET  /attendance/history    → Screen 5 (Attendance history log)
 * GET  /profile               → Screen 6 (Student profile + device)
 * POST /device-change-request → Screen 7 / More (Request device change)
 */

const express = require("express");
const router = express.Router();
const mobileController = require("../controllers/mobile.controller");
const { protect, studentOnly } = require("../middlewares");

// All mobile routes require authentication + student role
router.use(protect);
router.use(studentOnly);

/**
 * @swagger
 * /mobile/home:
 *   get:
 *     summary: Home screen data (Student)
 *     description: >
 *       Returns a single aggregated payload for the student Home screen:
 *       welcome header, live lecture banner (if in hall), today's schedule,
 *       and the next lecture countdown timer.
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home screen payload
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
 *                     studentName:
 *                       type: string
 *                       example: أحمد
 *                     todayLecturesCount:
 *                       type: integer
 *                       example: 3
 *                     todayDateFormatted:
 *                       type: string
 *                       example: 21 أبريل 2025
 *                     dayNameAr:
 *                       type: string
 *                       example: الأحد
 *                     liveLecture:
 *                       type: object
 *                       nullable: true
 *                       description: null when student is not inside any hall
 *                     todaySchedule:
 *                       type: array
 *                       items:
 *                         type: object
 *                     nextLecture:
 *                       type: object
 *                       nullable: true
 *                       description: Next upcoming lecture with countdown timer
 */
router.get("/home", mobileController.getHome);

/**
 * @swagger
 * /mobile/schedule:
 *   get:
 *     summary: Weekly schedule screen data (Student)
 *     description: >
 *       Returns the full academic week schedule (Saturday → Thursday) grouped by day.
 *       Each day includes the actual calendar date formatted in Arabic.
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly schedule
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
 *                     days:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           dayOfWeek:
 *                             type: integer
 *                             example: 6
 *                           dayNameAr:
 *                             type: string
 *                             example: السبت
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: 2025-04-19
 *                           dateFormatted:
 *                             type: string
 *                             example: 19 أبريل 2025
 *                           isToday:
 *                             type: boolean
 *                           lectures:
 *                             type: array
 *                             items:
 *                               type: object
 */
router.get("/schedule", mobileController.getSchedule);

/**
 * @swagger
 * /mobile/attendance/summary:
 *   get:
 *     summary: Attendance summary / circular progress (Student)
 *     description: >
 *       Returns attendance counts and percentage for a selected course,
 *       plus an alert object if the student is near or below the 75% threshold.
 *       Pass `courseId` as a query parameter to filter; defaults to first enrolled course.
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the course to inspect
 *     responses:
 *       200:
 *         description: Attendance summary
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
 *                     courses:
 *                       type: array
 *                       description: Dropdown options
 *                     selected:
 *                       type: object
 *                       properties:
 *                         courseId:
 *                           type: string
 *                         courseCode:
 *                           type: string
 *                         courseName:
 *                           type: string
 *                         totalLectures:
 *                           type: integer
 *                           example: 10
 *                         attendedCount:
 *                           type: integer
 *                           example: 8
 *                         absentCount:
 *                           type: integer
 *                           example: 2
 *                         attendancePercentage:
 *                           type: integer
 *                           example: 80
 *                         alert:
 *                           type: object
 *                           properties:
 *                             shouldAlert:
 *                               type: boolean
 *                             message:
 *                               type: string
 *                               nullable: true
 *                             level:
 *                               type: string
 *                               enum: [safe, warning, danger]
 */
router.get("/attendance/summary", mobileController.getAttendanceSummary);

/**
 * @swagger
 * /mobile/attendance/history:
 *   get:
 *     summary: Attendance history log (Student)
 *     description: >
 *       Returns paginated attendance records sorted newest first.
 *       Pass `courseId=all` (default) for all courses, or a specific courseId to filter.
 *       Status is returned both in English (`status`) and Arabic (`statusArabic`).
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Pass "all" for all courses or a valid MongoDB ObjectId
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
 *         description: Attendance history
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
 *                     courses:
 *                       type: array
 *                       description: Dropdown options including "كل المواد"
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recordId:
 *                             type: string
 *                           dateFormatted:
 *                             type: string
 *                             example: 21 مايو 2024
 *                           courseCode:
 *                             type: string
 *                           courseName:
 *                             type: string
 *                           doctorName:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [present, absent, late, excused]
 *                           statusArabic:
 *                             type: string
 *                             example: حضور
 *                           statusLevel:
 *                             type: string
 *                             enum: [success, danger, warning, info]
 *                     pagination:
 *                       type: object
 */
router.get("/attendance/history", mobileController.getAttendanceHistory);

/**
 * @swagger
 * /mobile/profile:
 *   get:
 *     summary: Student profile screen data (Student)
 *     description: >
 *       Returns student personal info, academic info, and bound device details.
 *       Device status is localised in Arabic (معتمد / قيد الاعتماد / غير مسجل).
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile payload
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
 *                     name:
 *                       type: string
 *                       example: أحمد كمال السيد
 *                     studentId:
 *                       type: string
 *                       example: 20230001
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     department:
 *                       type: string
 *                       example: هندسة اتصالات
 *                     level:
 *                       type: integer
 *                       example: 3
 *                     device:
 *                       type: object
 *                       properties:
 *                         isRegistered:
 *                           type: boolean
 *                         isVerified:
 *                           type: boolean
 *                         macAddress:
 *                           type: string
 *                         statusText:
 *                           type: string
 *                           example: معتمد
 *                         statusLevel:
 *                           type: string
 *                           enum: [success, warning, danger]
 *                     deviceChangeRequest:
 *                       type: object
 *                       nullable: true
 */
router.get("/profile", mobileController.getProfile);

/**
 * @swagger
 * /mobile/device-change-request:
 *   post:
 *     summary: Submit device change request (Student)
 *     description: >
 *       Allows a student to request binding a new device.
 *       Only one pending request is allowed at a time.
 *     tags: [Mobile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - newDeviceInfo
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 example: فقدت هاتفي القديم واشتريت هاتف جديد
 *               newDeviceInfo:
 *                 type: object
 *                 required:
 *                   - macAddress
 *                 properties:
 *                   macAddress:
 *                     type: string
 *                     example: "AA:BB:CC:DD:EE:FF"
 *                   deviceName:
 *                     type: string
 *                     example: iPhone 15 Pro
 *     responses:
 *       200:
 *         description: Request submitted successfully
 *       400:
 *         description: Validation error or pending request already exists
 */
router.post("/device-change-request", mobileController.requestDeviceChange);

module.exports = router;
