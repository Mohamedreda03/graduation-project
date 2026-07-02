/**
 * Database Students and Attendance Clear Script
 * Clears all student users and their associated attendance records,
 * connection logs, and student sessions.
 * Run: node src/seeders/clear-students.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");

// Models
const User = require("../models/User");
const AttendanceRecord = require("../models/AttendanceRecord");
const ConnectionLog = require("../models/ConnectionLog");
const StudentSession = require("../models/StudentSession");
const { ROLES } = require("../config/constants");

async function clearStudentsAndAttendance() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB\n");
    console.log("🧹 Starting students and attendance cleanup...");

    // Find all student IDs
    const students = await User.find({ role: ROLES.STUDENT }).select('_id');
    const studentIds = students.map(s => s._id);

    console.log(`Found ${studentIds.length} students to delete.`);

    if (studentIds.length > 0) {
      // 4. Delete the students themselves
      const studentResult = await User.deleteMany({ _id: { $in: studentIds } });
      console.log(`🗑️ Students deleted: ${studentResult.deletedCount}`);
    } else {
      console.log("No students found to delete.");
    }

    // 1. Delete ALL attendance records
    const attendanceResult = await AttendanceRecord.deleteMany({});
    console.log(`🗑️ All Attendance Records deleted: ${attendanceResult.deletedCount}`);

    // 2. Delete ALL connection logs (even orphaned ones)
    const connectionLogResult = await ConnectionLog.deleteMany({});
    console.log(`🗑️ All Connection Logs deleted: ${connectionLogResult.deletedCount}`);

    // 3. Delete ALL student sessions
    const sessionResult = await StudentSession.deleteMany({});
    console.log(`🗑️ All Student Sessions deleted: ${sessionResult.deletedCount}`);

    // 5. Reset all lectures status to scheduled (optional, but good practice when clearing attendance)
    const Lecture = require("../models/Lecture");
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
    console.log(`🔄 All Lectures reset to scheduled: ${lectureResult.modifiedCount}`);

    console.log("\n🎉 Cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
}

clearStudentsAndAttendance();
