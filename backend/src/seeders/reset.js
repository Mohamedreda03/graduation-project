/**
 * Database Reset Script
 * Clears ALL data EXCEPT the admin account and settings.
 * Run: node src/seeders/reset.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");

// Models
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Hall = require("../models/Hall");
const Lecture = require("../models/Lecture");
const AttendanceRecord = require("../models/AttendanceRecord");
const ConnectionLog = require("../models/ConnectionLog");
const StudentSession = require("../models/StudentSession");
const RefreshToken = require("../models/RefreshToken");
const Setting = require("../models/Setting");

async function reset() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB\n");

    // 1. Delete all non-admin users (students, doctors)
    const usersResult = await User.deleteMany({ role: { $ne: "admin" } });
    console.log(
      `🗑️  Users (students + doctors) deleted: ${usersResult.deletedCount}`,
    );

    // 2. Clear all collections
    const collections = [
      { model: Department, name: "Departments" },
      { model: Course, name: "Courses" },
      { model: Hall, name: "Halls" },
      { model: Lecture, name: "Lectures" },
      { model: AttendanceRecord, name: "Attendance Records" },
      { model: ConnectionLog, name: "Connection Logs" },
      { model: StudentSession, name: "Student Sessions" },
      { model: RefreshToken, name: "Refresh Tokens" },
    ];

    for (const { model, name } of collections) {
      const result = await model.deleteMany({});
      console.log(`🗑️  ${name} deleted: ${result.deletedCount}`);
    }

    // 3. Verify admin still exists
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      console.log(`\n✅ Admin account preserved: ${admin.email}`);
    } else {
      console.log("\n⚠️  No admin found! Run seed.js to create one.");
    }

    // 4. Show settings (preserved)
    const settingsCount = await Setting.countDocuments();
    console.log(`✅ Settings preserved: ${settingsCount} items`);

    console.log("\n🎉 Database reset completed! Admin + Settings kept.");
    console.log(
      "👉 Next: run 'node src/seeders/seed.js' to re-seed test data.",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error.message);
    process.exit(1);
  }
}

reset();
