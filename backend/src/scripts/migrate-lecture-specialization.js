/**
 * Migration: Populate Lecture.specialization from Course.specialization
 * Run with: node src/scripts/migrate-lecture-specialization.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const dbUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/graduation-project";

async function run() {
  console.log("Connecting to:", dbUri);
  await mongoose.connect(dbUri);

  const Lecture = require("../models/Lecture");
  const Course = require("../models/Course");

  // Find all lectures without a specialization field OR with null specialization
  const lectures = await Lecture.find({
    $or: [
      { specialization: { $exists: false } },
      { specialization: null }
    ]
  }).populate("course", "specialization level");

  console.log(`Found ${lectures.length} lectures without specialization field`);

  let updated = 0;
  for (const lecture of lectures) {
    const course = lecture.course;
    if (!course) continue;
    const specId = course.specialization;
    if (!specId) continue;

    await Lecture.updateOne(
      { _id: lecture._id },
      { $set: { specialization: specId, level: course.level } }
    );
    updated++;
  }

  console.log(`Updated ${updated} lectures`);
  await mongoose.disconnect();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
