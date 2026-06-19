const mongoose = require("mongoose");
require("dotenv").config();

let heartbeatInterval;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Start active heartbeat to prevent idle connection drop
    startHeartbeat();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(
      `💡 Make sure MongoDB is running and MONGODB_URI is correct in .env`,
    );
    process.exit(1);
  }
};

const startHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  console.log("💓 MongoDB heartbeat checker started (20s interval)");
  
  heartbeatInterval = setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.command({ ping: 1 });
        console.log("💓 MongoDB heartbeat ping sent successfully");
      } else {
        console.log(`💓 MongoDB heartbeat skipped. ReadyState: ${mongoose.connection.readyState}`);
      }
    } catch (err) {
      console.error(`⚠️ MongoDB heartbeat ping failed: ${err.message}`);
    }
  }, 20000); // Ping every 20 seconds
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB Error: ${err.message}`);
});

module.exports = connectDB;
