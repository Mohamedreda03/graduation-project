const express = require("express");
const router = express.Router();
const specializationsController = require("../controllers/specializations.controller");
const { protect, adminOnly } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /specializations:
 *   get:
 *     summary: Get all specializations
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of specializations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Specialization'
 */
router.get("/", specializationsController.getAllSpecializations);

/**
 * @swagger
 * /specializations/faculties:
 *   get:
 *     summary: Get all unique faculties
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique faculties
 */
router.get("/faculties", specializationsController.getFaculties);

/**
 * @swagger
 * /specializations/{id}:
 *   get:
 *     summary: Get specialization by ID
 *     tags: [Specializations]
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
 *         description: Specialization details
 *       404:
 *         description: Specialization not found
 */
router.get("/:id", specializationsController.getSpecialization);

/**
 * @swagger
 * /specializations:
 *   post:
 *     summary: Create a new specialization (Admin only)
 *     tags: [Specializations]
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
 *               - faculty
 *             properties:
 *               name:
 *                 type: string
 *                 example: "علوم الحاسب"
 *               code:
 *                 type: string
 *                 example: "CS"
 *               faculty:
 *                 type: string
 *                 example: "كلية الحاسبات والمعلومات"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Specialization created
 */
router.post("/", adminOnly, specializationsController.createSpecialization);

/**
 * @swagger
 * /specializations/{id}:
 *   put:
 *     summary: Update specialization (Admin only)
 *     tags: [Specializations]
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
 *               faculty:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Specialization updated
 *   delete:
 *     summary: Delete specialization (Admin only)
 *     tags: [Specializations]
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
 *         description: Specialization deleted
 */
router.put("/:id", adminOnly, specializationsController.updateSpecialization);
router.delete("/:id", adminOnly, specializationsController.deleteSpecialization);

module.exports = router;
