const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { protect } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with AI Assistant
 *     description: Ask questions to the AI assistant. Useful for students asking about attendance, doctors about reports, etc.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How many lectures did I attend this week?"
 *     responses:
 *       200:
 *         description: AI Response successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       example: "You attended 3 lectures this week."
 *       401:
 *         description: Unauthorized
 */
router.post("/chat", protect, aiController.chat);

module.exports = router;
