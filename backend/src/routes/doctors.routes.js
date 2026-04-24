const express = require("express");
const router = express.Router();
const doctorsController = require("../controllers/doctors.controller");
const { protect, adminOnly, adminOrDoctor } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /doctors/{id}/courses:
 *   get:
 *     summary: Get doctor's courses (Admin/Doctor)
 *     tags: [Doctors]
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
 *         description: List of courses taught by the doctor
 */
router.get("/:id/courses", adminOrDoctor, doctorsController.getDoctorCourses);

/**
 * @swagger
 * /doctors/{id}/lectures:
 *   get:
 *     summary: Get doctor's lecture schedule (Admin/Doctor)
 *     tags: [Doctors]
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
 *         description: Doctor's lecture schedule
 */
router.get("/:id/lectures", adminOrDoctor, doctorsController.getDoctorLectures);

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
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
 *         description: List of doctors
 */
router.get("/", adminOnly, doctorsController.getAllDoctors);

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Create a new doctor (Admin only)
 *     tags: [Doctors]
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created
 */
router.post("/", adminOnly, doctorsController.createDoctor);

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor by ID (Admin only)
 *     tags: [Doctors]
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
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 *   put:
 *     summary: Update doctor (Admin only)
 *     tags: [Doctors]
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
 *               department:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Doctor updated
 *   delete:
 *     summary: Delete doctor (Admin only)
 *     tags: [Doctors]
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
 *         description: Doctor deleted
 */
router.get("/:id", adminOnly, doctorsController.getDoctor);
router.put("/:id", adminOnly, doctorsController.updateDoctor);
router.delete("/:id", adminOnly, doctorsController.deleteDoctor);

/**
 * @swagger
 * /doctors/{id}/courses:
 *   post:
 *     summary: Assign courses to a doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/courses", adminOnly, doctorsController.assignCourses);

module.exports = router;
