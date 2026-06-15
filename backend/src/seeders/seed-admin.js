/**
 * Database Seeder - Admin and Settings Only
 * Run: node src/seeders/seed-admin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");
const { ROLES } = require("../config/constants");

// Models
const User = require("../models/User");
const Setting = require("../models/Setting");

// Default Admin
const defaultAdmin = {
  name: {
    first: "System",
    last: "Administrator",
  },
  email: "admin@smartattendance.edu",
  password: "admin123456",
  role: ROLES.ADMIN,
  isActive: true,
};

// Default Settings (Essential for system operations)
const defaultSettings = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 85,
    description:
      "Minimum presence percentage required for attendance to be marked as present",
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
    description:
      "Minutes after lecture end to auto-finalize attendance records",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Africa/Cairo",
    description: "System timezone for date/time calculations",
  },
];

async function seedAdminOnly() {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB");

    // Seed Admin
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if (!existingAdmin) {
      // User model handles password hashing automatically in pre-save hook
      await User.create(defaultAdmin);
      console.log("✅ Default admin created successfully");
      console.log(`   Email: ${defaultAdmin.email}`);
      console.log(`   Password: ${defaultAdmin.password}`);
    } else {
      console.log("ℹ️  Admin already exists");
    }

    // Seed Essential Settings
    let settingsCreated = 0;
    for (const setting of defaultSettings) {
      const exists = await Setting.findOne({ key: setting.key });
      if (!exists) {
        await Setting.create(setting);
        settingsCreated++;
      }
    }
    console.log(`✅ System settings seeded (${settingsCreated} new)`);

    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

// Run seeder
seedAdminOnly();
