const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { errorHandler, notFound } = require("./middlewares");
require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow credentials for cookies
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Admin dashboard dev
      "http://localhost:5174", // Doctor dashboard dev
      "http://localhost:3000", // React alternative
      process.env.ADMIN_DASHBOARD_URL, // Production admin
      process.env.DOCTOR_DASHBOARD_URL, // Production doctor
    ].filter(Boolean),
    credentials: true, // Ù…Ù‡Ù… Ù„Ù„Ù€ cookies
  }),
);

// Cookie parser
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: "10mb" }));

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Smart Attendance API Docs",
  }),
);

// Redirect /docs to /api-docs
app.get("/docs", (req, res) => {
  res.redirect("/api-docs");
});

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Ignore favicon requests (browser auto-requests it)
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/students", require("./routes/students.routes"));
app.use("/api/doctors", require("./routes/doctors.routes"));
app.use("/api/departments", require("./routes/departments.routes"));
app.use("/api/courses", require("./routes/courses.routes"));
app.use("/api/halls", require("./routes/halls.routes"));
app.use("/api/lectures", require("./routes/lectures.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/connections", require("./routes/connections.routes"));
app.use("/api/settings", require("./routes/settings.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/ai", require("./routes/ai.routes"));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
