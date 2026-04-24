const express = require("express");
const router = express.Router();
const hallsController = require("../controllers/halls.controller");
const { protect, adminOnly } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /halls:
 *   get:
 *     summary: Get all halls
 *     tags: [Halls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *       - in: query
 *         name: hallType
 *         schema:
 *           type: string
 *           enum: [lecture_hall, lab, classroom]
 *     responses:
 *       200:
 *         description: List of halls
 */
router.get("/", hallsController.getAllHalls);

/**
 * @swagger
 * /halls/{id}:
 *   get:
 *     summary: Get hall by ID
 *     tags: [Halls]
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
 *         description: Hall details
 *       404:
 *         description: Hall not found
 */
router.get("/:id", hallsController.getHall);

/**
 * @swagger
 * /halls/{id}/status:
 *   get:
 *     summary: Get hall current status (active lecture, connected students)
 *     tags: [Halls]
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
 *         description: Hall status with active lecture and connected students count
 */
router.get("/:id/status", hallsController.getHallStatus);

/**
 * @swagger
 * /halls:
 *   post:
 *     summary: Create a new hall (Admin only)
 *     tags: [Halls]
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
 *               - building
 *               - accessPoint
 *             properties:
 *               name:
 *                 type: string
 *                 example: "قاعة 101"
 *               building:
 *                 type: string
 *                 example: "مبنى الحاسبات"
 *               floor:
 *                 type: integer
 *                 default: 0
 *               capacity:
 *                 type: integer
 *               hallType:
 *                 type: string
 *                 enum: [lecture_hall, lab, classroom]
 *               accessPoint:
 *                 type: object
 *                 required:
 *                   - macAddress
 *                   - ssid
 *                 properties:
 *                   macAddress:
 *                     type: string
 *                     example: "AA:BB:CC:DD:EE:FF"
 *                   ssid:
 *                     type: string
 *                     example: "HALL_101_AP"
 *                   ipAddress:
 *                     type: string
 *     responses:
 *       201:
 *         description: Hall created
 */
router.post("/", adminOnly, hallsController.createHall);

/**
 * @swagger
 * /halls/{id}:
 *   put:
 *     summary: Update hall (Admin only)
 *     tags: [Halls]
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
 *               building:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hall updated
 *   delete:
 *     summary: Delete hall (Admin only)
 *     tags: [Halls]
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
 *         description: Hall deleted
 */
router.put("/:id", adminOnly, hallsController.updateHall);
router.delete("/:id", adminOnly, hallsController.deleteHall);

/**
 * @swagger
 * /halls/{id}/access-point:
 *   put:
 *     summary: Update hall access point (Admin only)
 *     tags: [Halls]
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
 *               macAddress:
 *                 type: string
 *               ssid:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Access point updated
 */
router.put("/:id/access-point", adminOnly, hallsController.updateAccessPoint);

module.exports = router;
