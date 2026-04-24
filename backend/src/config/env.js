require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  apApiKey: process.env.AP_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  attendance: {
    minPresencePercentage: parseInt(process.env.MIN_PRESENCE_PERCENTAGE) || 85,
    lateThresholdMinutes: parseInt(process.env.LATE_THRESHOLD_MINUTES) || 10,
  },
};
