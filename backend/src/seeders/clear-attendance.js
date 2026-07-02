/**
 * Database Attendance Clear and Lecture Reset Script
 * Clears all attendance records, connection logs, student sessions,
 * and resets all lectures to 'scheduled' status.
 * Run: node src/seeders/clear-attendance.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");

// Models
const Lecture = require("../models/Lecture");
const AttendanceRecord = require("../models/AttendanceRecord");
const ConnectionLog = require("../models/ConnectionLog");
const StudentSession = require("../models/StudentSession");

async function clearAttendance() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB\n");
    console.log("🧹 Starting attendance database cleanup...");

    // 1. Delete all attendance records
    const attendanceResult = await AttendanceRecord.deleteMany({});
    console.log(`🗑️ Attendance Records deleted: ${attendanceResult.deletedCount}`);

    // 2. Delete all connection logs
    const connectionLogResult = await ConnectionLog.deleteMany({});
    console.log(`🗑️ Connection Logs deleted: ${connectionLogResult.deletedCount}`);

    // 3. Delete all student sessions
    const sessionResult = await StudentSession.deleteMany({});
    console.log(`🗑️ Student Sessions deleted: ${sessionResult.deletedCount}`);

    // 4. Reset all lectures status to scheduled
    const lectureResult = await Lecture.updateMany(
      {},
      {
        $set: {
          status: "scheduled",
          actualStartTime: null,
          actualEndTime: null,
          isActive: true
        }
      }
    );
    console.log(`🔄 Lectures reset to scheduled: ${lectureResult.modifiedCount}`);

    console.log("\n🎉 Attendance cleanup and lecture reset completed successfully!");
    console.log("👉 You can now test the lecture attendance login from the beginning.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Attendance cleanup failed:", error.message);
    process.exit(1);
  }
}

clearAttendance();
