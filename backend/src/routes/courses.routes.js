const express = require("express");
const router = express.Router();
const coursesController = require("../controllers/courses.controller");
const { protect, adminOnly, adminOrDoctor } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
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
 *         name: doctor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get("/", coursesController.getAllCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
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
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get("/:id", coursesController.getCourse);

/**
 * @swagger
 * /courses/{id}/students:
 *   get:
 *     summary: Get course students (Admin/Doctor)
 *     tags: [Courses]
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
 *         description: List of enrolled students
 */
router.get("/:id/students", adminOrDoctor, coursesController.getCourseStudents);

/**
 * @swagger
 * /courses/{id}/attendance:
 *   get:
 *     summary: Get course attendance (Admin/Doctor)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance records for the course
 */
router.get(
  "/:id/attendance",
  adminOrDoctor,
  coursesController.getCourseAttendance,
);

/**
 * @swagger
 * /courses/{id}/attendance-report:
 *   get:
 *     summary: Get course attendance report (Admin/Doctor)
 *     tags: [Courses]
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
 *         description: Attendance report with statistics per student
 */
router.get(
  "/:id/attendance-report",
  adminOrDoctor,
  coursesController.getCourseAttendanceReport,
);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course (Admin only)
 *     tags: [Courses]
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
 *               - code
 *               - department
 *               - doctor
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               department:
 *                 type: string
 *               doctor:
 *                 type: string
 *               creditHours:
 *                 type: integer
 *                 default: 3
 *               level:
 *                 type: integer
 *               semester:
 *                 type: integer
 *                 enum: [1, 2]
 *     responses:
 *       201:
 *         description: Course created
 */
router.post("/", adminOnly, coursesController.createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update course (Admin only)
 *     tags: [Courses]
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
 *               code:
 *                 type: string
 *               doctor:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated
 *   delete:
 *     summary: Delete course (Admin only)
 *     tags: [Courses]
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
 *         description: Course deleted
 */
router.put("/:id", adminOnly, coursesController.updateCourse);
router.delete("/:id", adminOnly, coursesController.deleteCourse);

/**
 * @swagger
 * /courses/{id}/students:
 *   post:
 *     summary: Add students to course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                   type: string
 *                 description: Array of student IDs
 *     responses:
 *       200:
 *         description: Students added to course
 */
router.post("/:id/students", adminOnly, coursesController.addStudentsToCourse);

/**
 * @swagger
 * /courses/{id}/enroll:
 *   post:
 *     summary: Enroll students in course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/enroll", adminOnly, coursesController.enrollStudents);

/**
 * @swagger
 * /courses/{id}/unenroll:
 *   post:
 *     summary: Unenroll students from course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/unenroll", adminOnly, coursesController.unenrollStudents);

/**
 * @swagger
 * /courses/{id}/enroll-by-level:
 *   post:
 *     summary: Enroll students by academic level (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/enroll-by-level", adminOnly, coursesController.enrollByLevel);

/**
 * @swagger
 * /courses/{id}/attendance-stats:
 *   get:
 *     summary: Get course attendance statistics (Admin/Doctor)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/attendance-stats",
  adminOrDoctor,
  coursesController.getCourseAttendanceStats,
);

/**
 * @swagger
 * /courses/{id}/students/{studentId}:
 *   delete:
 *     summary: Remove student from course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student removed from course
 */
router.delete(
  "/:id/students/:studentId",
  adminOnly,
  coursesController.removeStudentFromCourse,
);

module.exports = router;
