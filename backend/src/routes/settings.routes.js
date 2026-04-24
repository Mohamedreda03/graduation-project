const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { protect, adminOnly } = require("../middlewares");

router.use(protect);
router.use(adminOnly);

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All system settings as key-value pairs
 */
router.get("/", settingsController.getAllSettings);

/**
 * @swagger
 * /settings/initialize:
 *   post:
 *     summary: Initialize default settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings initialized
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
 *                     created:
 *                       type: array
 *                       items:
 *                         type: string
 *                     skipped:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post("/initialize", settingsController.initializeSettings);

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     summary: Get a setting by key (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: MIN_PRESENCE_PERCENTAGE
 *     responses:
 *       200:
 *         description: Setting details
 *       404:
 *         description: Setting not found
 *   put:
 *     summary: Update a setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
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
 *               - value
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 *   delete:
 *     summary: Delete a setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted
 */
router.get("/:key", settingsController.getSetting);
router.put("/:key", settingsController.updateSetting);
router.delete("/:key", settingsController.deleteSetting);

module.exports = router;
