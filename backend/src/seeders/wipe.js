/**
 * ⚠️  Database Full Wipe Script
 * Deletes ALL data from ALL collections - no exceptions.
 * Run: node src/seeders/wipe.js
 *
 * After wiping, run:  npm run seed:admin
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");

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
  { model: User,             name: "Users (all)" },
  { model: Specialization,       name: "Specializations" },
  { model: Course,           name: "Courses" },
  { model: Hall,             name: "Halls" },
  { model: Lecture,          name: "Lectures" },
  { model: AttendanceRecord, name: "Attendance Records" },
  { model: ConnectionLog,    name: "Connection Logs" },
  { model: StudentSession,   name: "Student Sessions" },
  { model: RefreshToken,     name: "Refresh Tokens" },
  { model: Setting,          name: "Settings" },
];

async function wipeAll() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB\n");
    console.log("⚠️  Starting FULL database wipe...\n");

    let totalDeleted = 0;

    for (const { model, name } of allCollections) {
      const result = await model.deleteMany({});
      console.log(`🗑️  ${name} deleted: ${result.deletedCount}`);
      totalDeleted += result.deletedCount;
    }

    console.log(`\n✅ Total documents deleted: ${totalDeleted}`);
    console.log("🧹 Database is now completely empty.");
    console.log("\n👉 Next step: run  'npm run seed:admin'  to create the admin account.\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Wipe failed:", error.message);
    process.exit(1);
  }
}

wipeAll();
