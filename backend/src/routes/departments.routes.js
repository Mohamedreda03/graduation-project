const express = require("express");
const router = express.Router();
const departmentsController = require("../controllers/departments.controller");
const { protect, adminOnly } = require("../middlewares");

router.use(protect);

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
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
 *                     $ref: '#/components/schemas/Department'
 */
router.get("/", departmentsController.getAllDepartments);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
 *         description: Department details
 *       404:
 *         description: Department not found
 */
router.get("/:id", departmentsController.getDepartment);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department (Admin only)
 *     tags: [Departments]
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
 *         description: Department created
 */
router.post("/", adminOnly, departmentsController.createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update department (Admin only)
 *     tags: [Departments]
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
 *         description: Department updated
 *   delete:
 *     summary: Delete department (Admin only)
 *     tags: [Departments]
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
 *         description: Department deleted
 */
router.put("/:id", adminOnly, departmentsController.updateDepartment);
router.delete("/:id", adminOnly, departmentsController.deleteDepartment);

module.exports = router;
