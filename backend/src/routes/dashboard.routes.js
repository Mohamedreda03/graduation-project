const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect, adminOnly, adminOrDoctor } = require("../middlewares");

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     totalStudents:
 *                       type: integer
 *                     totalDoctors:
 *                       type: integer
 *                     totalCourses:
 *                       type: integer
 *                     totalDepartments:
 *                       type: integer
 *                     totalHalls:
 *                       type: integer
 *                     activeLectures:
 *                       type: integer
 *                     todayAttendance:
 *                       type: object
 *                       properties:
 *                         present:
 *                           type: integer
 *                         absent:
 *                           type: integer
 *                         rate:
 *                           type: number
 *                     weeklyTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                     atRiskStudents:
 *                       type: integer
 */
router.get("/stats", adminOrDoctor, dashboardController.getStats);

/**
 * @swagger
 * /dashboard/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health information
 */
router.get("/health", adminOnly, dashboardController.getSystemHealth);

/**
 * @swagger
 * /dashboard/activities:
 *   get:
 *     summary: Get recent activities
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of recent activities
 */
router.get(
  "/activities",
  adminOrDoctor,
  dashboardController.getRecentActivities,
);

/**
 * @swagger
 * /dashboard/quick-stats:
 *   get:
 *     summary: Get quick stats for header
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quick statistics
 */
router.get("/quick-stats", adminOrDoctor, dashboardController.getQuickStats);

module.exports = router;
