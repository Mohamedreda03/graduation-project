const express = require("express");
const router = express.Router();
const connectionsController = require("../controllers/connections.controller");
const { protect, adminOnly, verifyAccessPoint } = require("../middlewares");

/**
 * @swagger
 * /connections/event:
 *   post:
 *     summary: Handle WiFi connection event from Access Point
 *     tags: [Connections]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnectionEventRequest'
 *     responses:
 *       200:
 *         description: Event processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: string
 *                     hall:
 *                       type: string
 *                     eventType:
 *                       type: string
 *       401:
 *         description: Invalid API key
 *       404:
 *         description: Access Point not registered
 */
router.post(
  "/event",
  verifyAccessPoint,
  connectionsController.handleConnectionEvent,
);

// Admin routes
router.use(protect);
router.use(adminOnly);

/**
 * @swagger
 * /connections:
 *   get:
 *     summary: Get all connection logs (Admin only)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [device-connected, device-disconnected]
 *       - in: query
 *         name: macAddress
 *         schema:
 *           type: string
 *       - in: query
 *         name: hallId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of connection logs
 */
router.get("/", connectionsController.getConnectionLogs);

/**
 * @swagger
 * /connections/unprocessed:
 *   get:
 *     summary: Get unprocessed connection logs (Admin only)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unprocessed logs
 */
router.get("/unprocessed", connectionsController.getUnprocessedLogs);

/**
 * @swagger
 * /connections/hall/{hallId}:
 *   get:
 *     summary: Get connection logs for a specific hall (Admin only)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hallId
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
 *         description: Connection logs for the hall
 */
router.get("/hall/:hallId", connectionsController.getHallConnectionLogs);

/**
 * @swagger
 * /connections/{id}/reprocess:
 *   post:
 *     summary: Reprocess a connection log (Admin only)
 *     tags: [Connections]
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
 *         description: Log reprocessed successfully
 *       404:
 *         description: Log not found
 */
router.post("/:id/reprocess", connectionsController.reprocessLog);

module.exports = router;
