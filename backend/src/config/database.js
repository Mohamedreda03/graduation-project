const mongoose = require("mongoose");
const config = require("./env");

let heartbeatInterval;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
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
  
  heartbeatInterval = setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.command({ ping: 1 });
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
