const express = require("express");
const router = express.Router();
const lecturesController = require("../controllers/lectures.controller");
const { protect, adminOnly, adminOrDoctor } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /lectures:
 *   get:
 *     summary: Get all lectures
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *       - in: query
 *         name: hall
 *         schema:
 *           type: string
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *     responses:
 *       200:
 *         description: List of lectures
 */
router.get("/", lecturesController.getAllLectures);

/**
 * @swagger
 * /lectures/current:
 *   get:
 *     summary: Get currently active lectures
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of currently active lectures
 */
router.get("/current", lecturesController.getCurrentLectures);

/**
 * @swagger
 * /lectures/my-schedule:
 *   get:
 *     summary: Get my lecture schedule (Student/Doctor)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     description: Returns enrolled courses schedule for students, or teaching schedule for doctors
 *     responses:
 *       200:
 *         description: User's lecture schedule
 */
router.get("/my-schedule", lecturesController.getMySchedule);

/**
 * @swagger
 * /lectures/today:
 *   get:
 *     summary: Get today's lectures
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all lectures scheduled for today
 *     responses:
 *       200:
 *         description: Today's lectures
 */
router.get("/today", lecturesController.getTodayLectures);

/**
 * @swagger
 * /lectures/{id}:
 *   get:
 *     summary: Get lecture by ID
 *     tags: [Lectures]
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
 *         description: Lecture details
 *       404:
 *         description: Lecture not found
 */
router.get("/:id", lecturesController.getLecture);

/**
 * @swagger
 * /lectures:
 *   post:
 *     summary: Create a new lecture (Admin only)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course
 *               - hall
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               course:
 *                 type: string
 *                 description: Course ID
 *               hall:
 *                 type: string
 *                 description: Hall ID
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *                 description: "0=Sunday, 6=Saturday"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:30"
 *               lectureType:
 *                 type: string
 *                 enum: [lecture, section, lab]
 *               weekPattern:
 *                 type: string
 *                 enum: [weekly, odd, even]
 *     responses:
 *       201:
 *         description: Lecture created
 *       409:
 *         description: Time conflict with existing lecture
 */
router.post("/", adminOnly, lecturesController.createLecture);

/**
 * @swagger
 * /lectures/schedule:
 *   post:
 *     summary: Schedule recurring lectures (Admin only)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 */
router.post("/schedule", adminOnly, lecturesController.scheduleRecurring);

/**
 * @swagger
 * /lectures/by-date:
 *   get:
 *     summary: Get lectures by date
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 */
router.get("/by-date", lecturesController.getLecturesByDate);

/**
 * @swagger
 * /lectures/week-schedule:
 *   get:
 *     summary: Get week schedule
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *       - in: query
 *         name: hall
 *         schema:
 *           type: string
 */
router.get("/week-schedule", lecturesController.getWeekSchedule);

/**
 * @swagger
 * /lectures/{id}/start:
 *   post:
 *     summary: Start a lecture manually (Admin/Doctor)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/start", adminOrDoctor, lecturesController.startLecture);

/**
 * @swagger
 * /lectures/{id}/end:
 *   post:
 *     summary: End a lecture manually (Admin/Doctor)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/end", adminOrDoctor, lecturesController.endLecture);

/**
 * @swagger
 * /lectures/{id}/cancel:
 *   post:
 *     summary: Cancel a lecture (Admin/Doctor)
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/cancel", adminOrDoctor, lecturesController.cancelLecture);

/**
 * @swagger
 * /lectures/{id}:
 *   put:
 *     summary: Update lecture (Admin only)
 *     tags: [Lectures]
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
 *               hall:
 *                 type: string
 *               dayOfWeek:
 *                 type: integer
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lecture updated
 *   delete:
 *     summary: Delete lecture (Admin only)
 *     tags: [Lectures]
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
 *         description: Lecture deleted
 */
router.put("/:id", adminOnly, lecturesController.updateLecture);
router.delete("/:id", adminOnly, lecturesController.deleteLecture);

module.exports = router;
