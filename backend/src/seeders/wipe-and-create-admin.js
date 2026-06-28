/**
 * ⚠️  Database Wipe & Admin Creation Script
 * Wipes ALL data from all collections, then creates the default super admin and settings.
 * Run: node src/seeders/wipe-and-create-admin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");
const { ROLES, ADMIN_ROLES } = require("../config/constants");

// Models
const User = require("../models/User");
const Specialization = require("../models/Specialization");
const Course = require("../models/Course");
const Hall = require("../models/Hall");
const Lecture = require("../models/Lecture");
const AttendanceRecord = require("../models/AttendanceRecord");
const ConnectionLog = require("../models/ConnectionLog");
const StudentSession = require("../models/StudentSession");
const RefreshToken = require("../models/RefreshToken");
const Setting = require("../models/Setting");

const allCollections = [
  { model: User,             name: "Users" },
  { model: Specialization,   name: "Specializations" },
  { model: Course,           name: "Courses" },
  { model: Hall,             name: "Halls" },
  { model: Lecture,          name: "Lectures" },
  { model: AttendanceRecord, name: "Attendance Records" },
  { model: ConnectionLog,    name: "Connection Logs" },
  { model: StudentSession,   name: "Student Sessions" },
  { model: RefreshToken,     name: "Refresh Tokens" },
  { model: Setting,          name: "Settings" },
];

const defaultAdmin = {
  name: {
    first: "System",
    last: "Administrator",
  },
  email: "admin@smartattendance.edu",
  password: "admin123456",
  role: ROLES.ADMIN,
  adminRole: ADMIN_ROLES.SUPER_ADMIN,
  isActive: true,
};

const defaultSettings = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 50,
    description: "Minimum presence percentage required for attendance to be marked as present",
  },
  {
    key: "LATE_THRESHOLD_MINUTES",
    value: 15,
    description: "Minutes after lecture start to mark attendance as late",
  },
  {
    key: "EARLY_LEAVE_THRESHOLD_MINUTES",
    value: 10,
    description: "Minutes before lecture end to consider as early leave",
  },
  {
    key: "DEVICE_CHANGE_COOLDOWN_DAYS",
    value: 30,
    description: "Minimum days between device change requests",
  },
  {
    key: "MAX_DEVICE_CHANGES_PER_SEMESTER",
    value: 2,
    description: "Maximum number of device changes allowed per semester",
  },
  {
    key: "AUTO_FINALIZE_AFTER_MINUTES",
    value: 30,
    description: "Minutes after lecture end to auto-finalize attendance records",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Africa/Cairo",
    description: "System timezone for date/time calculations",
  },
];

async function wipeAndCreateAdmin() {
  try {
    if (!config.mongodbUri) {
      throw new Error("MONGODB_URI is not defined in the environment variables.");
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB successfully.\n");

    console.log("⚠️  Starting FULL database wipe...");
    let totalDeleted = 0;
    for (const { model, name } of allCollections) {
      const result = await model.deleteMany({});
      console.log(`🗑️  ${name} deleted: ${result.deletedCount}`);
      totalDeleted += result.deletedCount;
    }
    console.log(`\n🧹 Database wipe completed! Total documents deleted: ${totalDeleted}\n`);

    console.log("👤 Creating default super admin user...");
    // The User model handles password hashing automatically in a pre-save hook
    const newAdmin = await User.create(defaultAdmin);
    console.log("✅ Super Admin created successfully:");
    console.log(`   Email:    ${newAdmin.email}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log(`   Role:     ${newAdmin.role} (${newAdmin.adminRole})`);

    console.log("\n⚙️  Seeding essential system settings...");
    let settingsCreated = 0;
    for (const setting of defaultSettings) {
      await Setting.create(setting);
      settingsCreated++;
    }
    console.log(`✅ System settings seeded: ${settingsCreated} items.`);

    console.log("\n🎉 All operations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Operation failed:", error.message);
    process.exit(1);
  }
}

wipeAndCreateAdmin();
