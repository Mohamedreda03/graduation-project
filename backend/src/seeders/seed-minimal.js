/**
 * Minimal Database Seeder
 * Creates ONLY an Admin and ONE Student (with a base Specialization to link)
 * Run: node src/seeders/seed-minimal.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");
const { ROLES } = require("../config/constants");

// Models
const User = require("../models/User");
const Specialization = require("../models/Specialization");
const Setting = require("../models/Setting");

const defaultSettings = [
  { key: "MIN_PRESENCE_PERCENTAGE", value: 50, description: "Min presence %" },
  { key: "LATE_THRESHOLD_MINUTES", value: 15, description: "Late threshold" },
  { key: "EARLY_LEAVE_THRESHOLD_MINUTES", value: 10, description: "Early leave threshold" },
  { key: "DEVICE_CHANGE_COOLDOWN_DAYS", value: 30, description: "Cooldown days" },
  { key: "MAX_DEVICE_CHANGES_PER_SEMESTER", value: 2, description: "Max changes" },
  { key: "AUTO_FINALIZE_AFTER_MINUTES", value: 30, description: "Auto-finalize minutes" },
  { key: "SYSTEM_TIMEZONE", value: "Africa/Cairo", description: "Timezone" }
];

async function seedMinimal() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB");

    // 1. Settings
    let settingsCount = 0;
    for (const setting of defaultSettings) {
      const exists = await Setting.findOne({ key: setting.key });
      if (!exists) {
        await Setting.create(setting);
        settingsCount++;
      }
    }
    console.log(`✅ Settings seeded (${settingsCount} new)`);

    // 2. Admin
    const adminData = {
      name: { first: "System", last: "Admin" },
      email: "admin@smartattendance.edu",
      password: "admin123456",
      role: ROLES.ADMIN,
      isActive: true,
    };
    const admin = await User.findOne({ email: adminData.email });
    if (!admin) {
        await User.create(adminData);
        console.log(`✅ Admin created: ${adminData.email}`);
    } else {
        console.log(`ℹ️ Admin already exists: ${adminData.email}`);
    }

    // 3. Base Specialization for the Student
    const specData = {
      name: "عام",
      code: "GEN",
      faculty: "الكلية العامة",
      description: "قسم عام لاختبار الطلاب",
    };
    let spec = await Specialization.findOne({ code: specData.code });
    if (!spec) {
        spec = await Specialization.create(specData);
    }

    // 4. Single Student
    const studentData = {
      name: { first: "طالب", last: "اختبار" },
      email: "student@test.com",
      password: "student123",
      studentId: "20250001",
      role: ROLES.STUDENT,
      academicInfo: {
        specialization: spec._id,
        level: 1,
      },
      isActive: true,
    };
    
    // Check and create
    const existingStudent = await User.findOne({ email: studentData.email });
    if (!existingStudent) {
      await User.create(studentData);
      console.log(`✅ Student created: ${studentData.email} (Password: student123)`);
    } else {
      console.log(`ℹ️ Student already exists: ${studentData.email}`);
    }

    // 5. Single Doctor
    const doctorData = {
      name: { first: "دكتور", last: "اختبار" },
      email: "doctor@test.com",
      password: "doctor123",
      role: ROLES.DOCTOR,
      isActive: true,
    };
    
    const existingDoctor = await User.findOne({ email: doctorData.email });
    if (!existingDoctor) {
      await User.create(doctorData);
      console.log(`✅ Doctor created: ${doctorData.email} (Password: doctor123)`);
    } else {
      console.log(`ℹ️ Doctor already exists: ${doctorData.email}`);
    }

    console.log("\n🎉 Minimal seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedMinimal();
