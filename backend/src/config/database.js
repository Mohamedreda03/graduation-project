const mongoose = require("mongoose");
require("dotenv").config();

let heartbeatInterval;

/**
 * MongoDB Connection Options optimized for production stability
 */
const connectionOptions = {
  // Connection Pool
  maxPoolSize: 10,
  minPoolSize: 2,

  // Timeouts
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 0,

  // Heartbeat
  heartbeatFrequencyMS: 10000,

  // Network
  family: 4,

  // Retry Logic
  retryWrites: true,
  retryReads: true,
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔧 Pool Size: ${connectionOptions.minPoolSize}-${connectionOptions.maxPoolSize}`);

    // Start heartbeat
    startHeartbeat();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`💡 Make sure MongoDB is running and MONGODB_URI is correct`);
    // Retry in 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

/**
 * Heartbeat - keeps connection alive
 */
const startHeartbeat = () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  console.log("💓 MongoDB heartbeat started (30s interval)");

  let counter = 0;
  heartbeatInterval = setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.command({ ping: 1 });
        counter++;
        // Log every 5 minutes only
        if (counter % 10 === 0) {
          console.log("💓 MongoDB heartbeat OK");
          counter = 0;
        }
      }
    } catch (err) {
      console.error(`⚠️ Heartbeat failed: ${err.message}`);
    }
  }, 30000);
};

// Connection events
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected - auto-reconnect active");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB Error: ${err.message}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`📴 ${signal} received. Closing MongoDB...`);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB closed gracefully");
  } catch (err) {
    console.error(`❌ Error closing MongoDB: ${err.message}`);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;
