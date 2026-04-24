const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { protect } = require("../middlewares/auth.middleware");

// AI Routes
router.post("/chat", protect, aiController.chat);

module.exports = router;
