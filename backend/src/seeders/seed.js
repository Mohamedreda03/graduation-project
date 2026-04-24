/**
 * Database Seeder
 * Run: node src/seeders/seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/env");
const { ROLES } = require("../config/constants");

// Models
const User = require("../models/User");
const Department = require("../models/Department");
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

// Default Settings
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

// Sample Department (for testing)
const sampleDepartment = {
  name: "Computer Science",
  code: "CS",
  faculty: "Faculty of Computers and Information",
  description: "Computer Science Department",
};

async function seed() {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB");

    // Seed Admin
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if (!existingAdmin) {
      // لا نحتاج hash لأن الـ User model يعمله تلقائياً في pre-save hook
      await User.create(defaultAdmin);
      console.log("✅ Default admin created");
      console.log(`   Email: ${defaultAdmin.email}`);
      console.log(`   Password: ${defaultAdmin.password}`);
    } else {
      console.log("ℹ️  Admin already exists");
    }

    // Seed Settings
    let settingsCreated = 0;
    for (const setting of defaultSettings) {
      const exists = await Setting.findOne({ key: setting.key });
      if (!exists) {
        await Setting.create(setting);
        settingsCreated++;
      }
    }
    console.log(`✅ Settings seeded (${settingsCreated} new)`);

    // Seed Sample Department
    let department = await Department.findOne({
      code: sampleDepartment.code,
    });
    if (!department) {
      department = await Department.create(sampleDepartment);
      console.log("✅ Sample department created");
    } else {
      console.log("ℹ️  Sample department already exists");
    }

    // Seed Sample Students
    const sampleStudents = [
      {
        name: { first: "أحمد", last: "محمد" },
        email: "ahmed@student.edu",
        password: "student123",
        studentId: "20210001",
        role: ROLES.STUDENT,
        academicInfo: {
          department: department._id,
          level: 3,
        },
        isActive: true,
      },
      {
        name: { first: "محمد", last: "علي" },
        email: "mohamed@student.edu",
        password: "student123",
        studentId: "20210002",
        role: ROLES.STUDENT,
        academicInfo: {
          department: department._id,
          level: 3,
        },
        isActive: true,
      },
      {
        name: { first: "فاطمة", last: "أحمد" },
        email: "fatma@student.edu",
        password: "student123",
        studentId: "20210003",
        role: ROLES.STUDENT,
        academicInfo: {
          department: department._id,
          level: 2,
        },
        isActive: true,
      },
      {
        name: { first: "سارة", last: "محمود" },
        email: "sara@student.edu",
        password: "student123",
        studentId: "20210004",
        role: ROLES.STUDENT,
        academicInfo: {
          department: department._id,
          level: 1,
        },
        isActive: true,
      },
      {
        name: { first: "يوسف", last: "إبراهيم" },
        email: "yousef@student.edu",
        password: "student123",
        studentId: "20210005",
        role: ROLES.STUDENT,
        academicInfo: {
          department: department._id,
          level: 4,
        },
        isActive: true,
      },
    ];

    let studentsCreated = 0;
    for (const student of sampleStudents) {
      const exists = await User.findOne({ studentId: student.studentId });
      if (!exists) {
        await User.create(student);
        studentsCreated++;
      }
    }
    if (studentsCreated > 0) {
      console.log(`✅ Sample students created (${studentsCreated} new)`);
    } else {
      console.log("ℹ️  Sample students already exist");
    }

    // Seed Sample Doctor
    const sampleDoctor = {
      name: { first: "د. محمد", last: "عبدالله" },
      email: "doctor@edu.eg",
      password: "doctor123",
      role: ROLES.DOCTOR,
      phone: "01012345678",
      isActive: true,
    };
    const existingDoctor = await User.findOne({ email: sampleDoctor.email });
    if (!existingDoctor) {
      await User.create(sampleDoctor);
      console.log("✅ Sample doctor created");
    } else {
      console.log("ℹ️  Sample doctor already exists");
    }

    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

// Run seeder
seed();
