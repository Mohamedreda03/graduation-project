/**
 * Database Seeder - RBAC users
 * Run: node src/seeders/seed-rbac.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/env");
const { ROLES, ADMIN_ROLES } = require("../config/constants");

// Models
const User = require("../models/User");
const Specialization = require("../models/Specialization");

const rbacUsers = [
  // 1. Super Admin
  {
    name: { first: "Super", last: "Admin" },
    email: "super.admin@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.SUPER_ADMIN,
    isActive: true,
  },
  // 2. Dean
  {
    name: { first: "Dean", last: "User" },
    email: "dean@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.DEAN,
    isActive: true,
  },
  // 3. Student Affairs
  {
    name: { first: "Student", last: "Affairs" },
    email: "student.affairs@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.STUDENT_AFFAIRS,
    isActive: true,
  },
  // 4. Doctor
  {
    name: { first: "Doctor", last: "User" },
    email: "doctor@smartattendance.edu",
    password: "doctor123",
    role: ROLES.DOCTOR,
    isActive: true,
  },
  // 5. Student
  {
    name: { first: "Student", last: "User" },
    email: "student@smartattendance.edu",
    password: "student123",
    studentId: "20249999",
    role: ROLES.STUDENT,
    isActive: true,
  }
];

async function seedRBAC() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    // 1. Find or create a specialization (Department)
    let csDept = await Specialization.findOne({ code: "CS" });
    if (!csDept) {
      csDept = await Specialization.create({
        name: "Computer Science",
        code: "CS",
        faculty: "Faculty of Computers and Information",
        description: "Computer Science Specialization",
      });
      console.log("✅ Created Computer Science Specialization");
    } else {
      console.log("ℹ️  Computer Science Specialization already exists");
    }

    // 2. Add Head of Department to RBAC users list dynamically
    const hodUser = {
      name: { first: "HOD", last: "CS" },
      email: "hod.cs@smartattendance.edu",
      password: "admin123456",
      role: ROLES.ADMIN,
      adminRole: ADMIN_ROLES.HEAD_OF_DEPT,
      department: csDept._id,
      isActive: true,
    };

    const usersToSeed = [...rbacUsers, hodUser];

    // 3. Seed Users
    let usersCreated = 0;
    for (const userData of usersToSeed) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.name.first} ${userData.name.last} (${userData.role}${userData.adminRole ? ' - ' + userData.adminRole : ''})`);
        usersCreated++;
      } else {
        console.log(`ℹ️  User already exists: ${userData.email}`);
      }
    }

    console.log(`\n🎉 RBAC Seeding completed successfully! Created ${usersCreated} users.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedRBAC();
