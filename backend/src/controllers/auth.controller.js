const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { User, RefreshToken } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync } = require("../utils/helpers");
const config = require("../config/env");
const { ROLES } = require("../config/constants");

/**
 * Cookie options for tokens
 */
const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 15 * 60 * 1000,
});

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/**
 * Generate tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

/**
 * Prepare user data for response
 */
const prepareUserData = (user) => ({
  _id: user._id,
  id: user._id,
  email: user.email,
  studentId: user.studentId,
  name: user.fullName,
  role: user.role,
  academicInfo: user.academicInfo,
  device: user.device,
  isActive: user.isActive,
});

/**
 * Check if request is from a web client
 */
const isWebClient = (req) => {
  // Web clients send cookies, mobile clients use Authorization header
  return (
    !!req.cookies?.accessToken ||
    !!req.cookies?.refreshToken ||
    (req.headers.origin && !req.headers.authorization)
  );
};

/**
 * Web Login (Admin & Doctor only)
 * POST /api/auth/web/login
 * Uses httpOnly cookies for token storage
 */
exports.webLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // Only admin and doctor can login via web
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.DOCTOR) {
    throw ApiError.forbidden("هذه الصفحة متاحة فقط للمسؤولين والدكاترة");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("الحساب معطل");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: refreshExpiry,
  });

  // Clear old cookies and set new ones
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  // Return user data only (no tokens in body for security)
  res.status(200).json({
    success: true,
    data: {
      user: prepareUserData(user),
    },
  });
});

/**
 * Mobile Login (Students only)
 * POST /api/auth/mobile/login
 * Returns tokens in response body
 */
exports.mobileLogin = catchAsync(async (req, res, next) => {
  const { email, studentId, password, deviceInfo } = req.body;

  // Find user by email or studentId
  const query = email ? { email } : { studentId };
  const user = await User.findOne(query).select("+password");

  if (!user) {
    throw ApiError.unauthorized("بيانات الدخول غير صحيحة");
  }

  // Only students can login via mobile
  if (user.role !== ROLES.STUDENT) {
    throw ApiError.forbidden("تطبيق الموبايل متاح للطلاب فقط");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("الحساب معطل");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("بيانات الدخول غير صحيحة");
  }

  // Handle device binding for students
  if (deviceInfo && deviceInfo.macAddress) {
    if (!user.device || !user.device.isVerified) {
      // First login ever - generate server-side deviceId and bind device
      user.device = {
        deviceId: uuidv4(),
        macAddress: deviceInfo.macAddress,
        registeredAt: new Date(),
        isVerified: true,
      };
    } else if (user.device.macAddress === deviceInfo.macAddress) {
      // Same device - no updates needed
      // deviceId stays the same (server-generated)
    } else {
      // Different device - reject
      throw ApiError.forbidden(
        "هذا الحساب مسجل على جهاز آخر. يرجى استخدام الجهاز المسجل أو طلب تغيير الجهاز.",
      );
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    deviceId: deviceInfo?.deviceId,
    expiresAt: refreshExpiry,
  });

  // Return tokens in response body for mobile (always include deviceId)
  res.status(200).json({
    success: true,
    data: {
      user: prepareUserData(user),
      accessToken,
      refreshToken,
    },
  });
});

/**
 * Web Refresh Token
 * POST /api/auth/web/refresh
 * Uses refresh token from cookie
 */
exports.webRefreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    throw ApiError.unauthorized("Refresh token is required");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    throw ApiError.unauthorized("Invalid refresh token");
  }

  // Check if token exists in database
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    user: decoded.id,
  });

  if (!storedToken) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    throw ApiError.unauthorized("Refresh token not found");
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await storedToken.deleteOne();
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    throw ApiError.unauthorized("Refresh token expired");
  }

  // Generate new tokens
  const tokens = generateTokens(decoded.id);

  // Update refresh token in database
  storedToken.token = tokens.refreshToken;
  storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storedToken.save();

  // Set new cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.cookie("accessToken", tokens.accessToken, getAccessTokenCookieOptions());
  res.cookie(
    "refreshToken",
    tokens.refreshToken,
    getRefreshTokenCookieOptions(),
  );

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
  });
});

/**
 * Web Logout
 * POST /api/auth/web/logout
 * Clears cookies and invalidates refresh token
 */
exports.webLogout = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});

/**
 * Mobile Refresh Token
 * POST /api/auth/mobile/refresh
 * Uses refresh token from body
 */
exports.mobileRefreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.badRequest("Refresh token is required");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  // Check if token exists in database
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    user: decoded.id,
  });

  if (!storedToken) {
    throw ApiError.unauthorized("Refresh token not found");
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await storedToken.deleteOne();
    throw ApiError.unauthorized("Refresh token expired");
  }

  // Generate new tokens
  const tokens = generateTokens(decoded.id);

  // Update refresh token in database
  storedToken.token = tokens.refreshToken;
  storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storedToken.save();

  res.status(200).json({
    success: true,
    data: tokens,
  });
});

/**
 * Mobile Logout
 * POST /api/auth/mobile/logout
 * Invalidates refresh token
 */
exports.mobileLogout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});

/**
 * Legacy login (kept for backward compatibility)
 * POST /api/auth/login
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, studentId, password, deviceInfo } = req.body;

  // Find user by email or studentId
  const query = email ? { email } : { studentId };
  const user = await User.findOne(query).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("Account is deactivated");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  // Handle device binding for students
  if (user.role === "student" && deviceInfo && deviceInfo.macAddress) {
    if (!user.device || !user.device.isVerified) {
      // First login ever - generate server-side deviceId and bind device
      user.device = {
        deviceId: uuidv4(),
        macAddress: deviceInfo.macAddress,
        registeredAt: new Date(),
        isVerified: true,
      };
    } else if (user.device.macAddress === deviceInfo.macAddress) {
      // Same device - no updates needed
    } else {
      // Different device - reject
      throw ApiError.forbidden(
        "This account is registered to another device. Please use your registered device or request a device change.",
      );
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    deviceId: deviceInfo?.deviceId,
    expiresAt: refreshExpiry,
  });

  // Prepare user data
  const userData = {
    _id: user._id,
    id: user._id,
    email: user.email,
    studentId: user.studentId,
    name: user.fullName, // استخدام الـ virtual fullName بدلاً من object
    role: user.role,
    academicInfo: user.academicInfo,
    device: user.device,
    isActive: user.isActive,
  };

  // Check if request is from Web or Mobile
  if (isWebClient(req)) {
    // 🌐 WEB: Set httpOnly cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Set new cookies
    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    // Return user only (no tokens in body for security)
    res.status(200).json({
      success: true,
      data: {
        user: userData,
      },
    });
  } else {
    // 📱 MOBILE: Return tokens in response body
    res.status(200).json({
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    });
  }
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  // Get refresh token from cookie (web) or body (mobile)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw ApiError.badRequest("Refresh token is required");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    // Clear cookies if invalid
    if (isWebClient(req)) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    }
    throw ApiError.unauthorized("Invalid refresh token");
  }

  // Check if token exists in database
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    user: decoded.id,
  });

  if (!storedToken) {
    // Clear invalid cookies
    if (isWebClient(req)) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    }
    throw ApiError.unauthorized("Refresh token not found");
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await storedToken.deleteOne();
    throw ApiError.unauthorized("Refresh token expired");
  }

  // Generate new tokens
  const tokens = generateTokens(decoded.id);

  // Update refresh token in database
  storedToken.token = tokens.refreshToken;
  storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storedToken.save();

  // Check if request is from Web or Mobile
  const isWeb = isWebClient(req);

  if (isWeb) {
    // 🌐 WEB: Set new cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Set new cookies
    res.cookie(
      "accessToken",
      tokens.accessToken,
      getAccessTokenCookieOptions(),
    );
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  } else {
    // 📱 MOBILE: Return tokens in response body
    res.status(200).json({
      success: true,
      data: tokens,
    });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = catchAsync(async (req, res, next) => {
  // Get refresh token from cookie (web) or body (mobile)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  // Clear cookies for web clients
  if (isWebClient(req)) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Remove all refresh tokens
  await RefreshToken.removeAllForUser(user._id);

  // Generate new tokens
  const tokens = generateTokens(user._id);

  // Save new refresh token
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  await RefreshToken.create({
    token: tokens.refreshToken,
    user: user._id,
    expiresAt: refreshExpiry,
  });

  if (isWebClient(req)) {
    // Web: Set httpOnly cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.cookie(
      "accessToken",
      tokens.accessToken,
      getAccessTokenCookieOptions(),
    );
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } else {
    // Mobile: Return tokens in body
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: tokens,
    });
  }
});
