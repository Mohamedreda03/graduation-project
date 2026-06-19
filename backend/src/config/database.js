const mongoose = require("mongoose");
require("dotenv").config();

let heartbeatInterval;
let reconnectTimeout;

/**
 * MongoDB Connection Options optimized for production stability
 * Prevents idle disconnections on resource-constrained servers
 */
const connectionOptions = {
  // Connection Pool Settings
  maxPoolSize: 10,               // Max connections in pool (default: 100, reduced for low-memory servers)
  minPoolSize: 2,                // Keep at least 2 connections alive
  maxIdleTimeMS: 60000,          // Close idle connections after 60s (prevents stale connections)

  // Timeout Settings
  serverSelectionTimeoutMS: 30000,  // Wait 30s to find a server before erroring
  connectTimeoutMS: 30000,          // Wait 30s for initial connection
  socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity

  // Heartbeat & Monitoring
  heartbeatFrequencyMS: 10000,      // Check server health every 10s (default: 10s)

  // Write Concern
  writeConcern: {
    w: "majority",                  // Wait for majority acknowledgment
    wtimeout: 10000,                // Write timeout 10s
  },

  // Retry Logic
  retryWrites: true,                // Automatically retry failed writes
  retryReads: true,                 // Automatically retry failed reads

  // Compression (reduces network overhead)
  compressors: ["zlib"],
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔧 Pool Size: ${connectionOptions.minPoolSize}-${connectionOptions.maxPoolSize}`);

    // Start active heartbeat to prevent idle connection drop
    startHeartbeat();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(
      `💡 Make sure MongoDB is running and MONGODB_URI is correct in .env`,
    );
    // Retry connection after 5 seconds instead of crashing
    console.log("🔄 Retrying connection in 5 seconds...");
    reconnectTimeout = setTimeout(connectDB, 5000);
  }
};

/**
 * Active heartbeat mechanism
 * Sends lightweight ping to prevent MongoDB from dropping idle connections
 * Also handles reconnection if connection is lost
 */
const startHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  console.log("💓 MongoDB heartbeat checker started (30s interval)");

  heartbeatInterval = setInterval(async () => {
    try {
      const readyState = mongoose.connection.readyState;

      if (readyState === 1 && mongoose.connection.db) {
        // Connected - send lightweight ping
        await mongoose.connection.db.command({ ping: 1 });
        // Only log every 5 minutes to reduce log noise
        // (heartbeat runs every 30s, so log every 10th ping)
        if (!startHeartbeat._counter) startHeartbeat._counter = 0;
        startHeartbeat._counter++;
        if (startHeartbeat._counter % 10 === 0) {
          console.log("💓 MongoDB heartbeat OK");
          startHeartbeat._counter = 0;
        }
      } else if (readyState === 0) {
        // Disconnected - Mongoose will auto-reconnect with buffering
        console.log("💓 MongoDB disconnected (readyState: 0). Mongoose auto-reconnect is active.");
      } else if (readyState === 2) {
        // Connecting - wait for it
        console.log("💓 MongoDB connecting (readyState: 2). Waiting...");
      } else if (readyState === 3) {
        // Disconnecting - wait for it
        console.log("💓 MongoDB disconnecting (readyState: 3). Waiting...");
      }
    } catch (err) {
      console.error(`⚠️ MongoDB heartbeat ping failed: ${err.message}`);
    }
  }, 30000); // Ping every 30 seconds (less aggressive than 20s)
};

// ========================
// Connection Event Handlers
// ========================

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected - Mongoose will attempt auto-reconnect");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected successfully");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB Error: ${err.message}`);
});

// Cleanup on application shutdown
const gracefulShutdown = async (signal) => {
  console.log(`📴 ${signal} received. Closing MongoDB connection...`);

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed gracefully");
  } catch (err) {
    console.error(`❌ Error closing MongoDB: ${err.message}`);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;
