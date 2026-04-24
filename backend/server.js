const app = require("./src/app");
const connectDB = require("./src/config/database");
const config = require("./src/config/env");
const { schedulerService } = require("./src/services");

// Connect to database
connectDB();

// Initialize scheduler for attendance auto-finalization
schedulerService.initScheduler();

// Start server
const server = app.listen(config.port, () => {
  const baseUrl = `http://localhost:${config.port}`;
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🎓 Smart Attendance System - Backend                     ║
  ║                                                            ║
  ║   📡 Server:      ${baseUrl.padEnd(39)}║
  ║   🌍 Environment: ${config.nodeEnv.padEnd(39)}║
  ║   ⏰ Scheduler:   Active                                   ║
  ║                                                            ║
  ║   📚 API Docs:    ${(baseUrl + "/api-docs").padEnd(39)}║
  ║   🔗 API Base:    ${(baseUrl + "/api").padEnd(39)}║
  ║   ❤️  Health:     ${(baseUrl + "/health").padEnd(39)}║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err.message);
  console.error(err.stack);
  // Don't crash the server in production, just log the error
  if (config.nodeEnv === "development") {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
  console.error(err.stack);
  // Graceful shutdown - give time for ongoing requests to complete
  server.close(() => {
    console.log("Server closed due to uncaught exception");
    process.exit(1);
  });
  // Force close after 10 seconds
  setTimeout(() => {
    process.exit(1);
  }, 10000);
});

// Handle SIGTERM for graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
