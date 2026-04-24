const express = require("express");
const router = express.Router();
const studentsController = require("../controllers/students.controller");
const {
  protect,
  adminOnly,
  adminOrDoctor,
  studentOnly,
} = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /students/my-device:
 *   get:
 *     summary: Get current student's device info
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device information
 *       401:
 *         description: Unauthorized
 */
router.get("/my-device", studentOnly, studentsController.getMyDevice);

/**
 * @swagger
 * /students/request-device-change:
 *   post:
 *     summary: Request device change (Student)
 *     tags: [Students]
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
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 example: "فقدت هاتفي القديم واشتريت هاتف جديد"
 *     responses:
 *       200:
 *         description: Request submitted successfully
 *       400:
 *         description: Pending request exists
 */
router.post(
  "/request-device-change",
  studentOnly,
  studentsController.requestDeviceChange,
);

/**
 * @swagger
 * /students/stats:
 *   get:
 *     summary: Get student statistics (Admin/Doctor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics
 */
router.get("/stats", adminOrDoctor, studentsController.getStudentStats);

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students (Admin/Doctor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
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
 *         description: List of students
 */
router.get("/", adminOrDoctor, studentsController.getAllStudents);

/**
 * @swagger
 * /students/device-requests:
 *   get:
 *     summary: Get all device change requests (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of device change requests
 */
router.get(
  "/device-requests",
  adminOnly,
  studentsController.getDeviceChangeRequests,
);

/**
 * @swagger
 * /students/device-requests/{id}/approve:
 *   post:
 *     summary: Approve device change request (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request approved
 */
router.post(
  "/device-requests/:id/approve",
  adminOnly,
  studentsController.approveDeviceChange,
);

/**
 * @swagger
 * /students/device-requests/{id}/reject:
 *   post:
 *     summary: Reject device change request (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.post(
  "/device-requests/:id/reject",
  adminOnly,
  studentsController.rejectDeviceChange,
);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID (Admin/Doctor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get("/:id", adminOrDoctor, studentsController.getStudent);

/**
 * @swagger
 * /students/{id}/attendance:
 *   get:
 *     summary: Get student attendance records (Admin/Doctor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance records
 */
router.get(
  "/:id/attendance",
  adminOrDoctor,
  studentsController.getStudentAttendance,
);

/**
 * @swagger
 * /students/{id}/attendance-summary:
 *   get:
 *     summary: Get student attendance summary (Admin/Doctor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance summary per course
 */
router.get(
  "/:id/attendance-summary",
  adminOrDoctor,
  studentsController.getStudentAttendanceSummary,
);

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - studentId
 *               - department
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               studentId:
 *                 type: string
 *               department:
 *                 type: string
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *     responses:
 *       201:
 *         description: Student created
 */
router.post("/", adminOnly, studentsController.createStudent);

/**
 * @swagger
 * /students/bulk:
 *   post:
 *     summary: Create multiple students (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - students
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     department:
 *                       type: string
 *                     level:
 *                       type: integer
 *               defaultPassword:
 *                 type: string
 *                 default: "123456"
 *     responses:
 *       201:
 *         description: Students created
 */
router.post("/bulk", adminOnly, studentsController.createStudentsBulk);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Student updated
 */
router.put("/:id", adminOnly, studentsController.updateStudent);

module.exports = router;
