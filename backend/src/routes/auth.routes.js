const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares");
const { validate } = require("../middlewares");
const {
  loginSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

// Rate limiter for login/refresh endpoints only (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  message: {
    success: false,
    error:
      "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===========================================
// WEB ROUTES (Admin & Doctor - uses cookies)
// ===========================================

/**
 * @swagger
 * /auth/web/login:
 *   post:
 *     summary: Web login for Admin and Doctor
 *     description: Login for admin and doctor users. Tokens are stored in httpOnly cookies.
 *     tags: [Auth - Web]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@smartattendance.edu
 *               password:
 *                 type: string
 *                 example: admin123456
 *     responses:
 *       200:
 *         description: Login successful (cookies set automatically)
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User is not admin or doctor
 */
router.post(
  "/web/login",
  authLimiter,
  validate(loginSchema),
  authController.webLogin,
);

/**
 * @swagger
 * /auth/web/refresh:
 *   post:
 *     summary: Refresh tokens for web clients
 *     description: Uses refresh token from cookie to generate new tokens
 *     tags: [Auth - Web]
 *     responses:
 *       200:
 *         description: Tokens refreshed (new cookies set)
 *       401:
 *         description: Invalid refresh token
 */
router.post("/web/refresh", authLimiter, authController.webRefreshToken);

/**
 * @swagger
 * /auth/web/logout:
 *   post:
 *     summary: Logout for web clients
 *     description: Clears cookies and invalidates refresh token
 *     tags: [Auth - Web]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/web/logout", protect, authController.webLogout);

// ===========================================
// MOBILE ROUTES (Students - returns tokens)
// ===========================================

/**
 * @swagger
 * /auth/mobile/login:
 *   post:
 *     summary: Mobile login for Students
 *     description: Login for student users. Tokens are returned in response body.
 *     tags: [Auth - Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: student1@student.edu
 *               studentId:
 *                 type: string
 *                 example: "20210001"
 *               password:
 *                 type: string
 *                 example: student123
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   macAddress:
 *                     type: string
 *                   deviceName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login successful with tokens in body
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User is not a student or device mismatch
 */
router.post(
  "/mobile/login",
  authLimiter,
  validate(loginSchema),
  authController.mobileLogin,
);

/**
 * @swagger
 * /auth/mobile/refresh:
 *   post:
 *     summary: Refresh tokens for mobile clients
 *     description: Uses refresh token from body to generate new tokens
 *     tags: [Auth - Mobile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens in response body
 *       401:
 *         description: Invalid refresh token
 */
router.post("/mobile/refresh", authLimiter, authController.mobileRefreshToken);

/**
 * @swagger
 * /auth/mobile/logout:
 *   post:
 *     summary: Logout for mobile clients
 *     description: Invalidates refresh token
 *     tags: [Auth - Mobile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/mobile/logout", protect, authController.mobileLogout);

// ===========================================
// LEGACY ROUTES (kept for backward compatibility)
// ===========================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login (Legacy)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authLimiter, authController.refreshToken);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/change-password",
  validate(changePasswordSchema),
  authController.changePassword,
);

module.exports = router;
