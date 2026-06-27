/**
 * Migration: Populate Lecture.semester from Course.semester
 * Run with: node src/scripts/migrate-lecture-semester.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const dbUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/graduation-project";

async function run() {
  console.log("Connecting to:", dbUri);
  await mongoose.connect(dbUri);

  const Lecture = require("../models/Lecture");
  const Course = require("../models/Course");

  // Find all lectures without a semester field OR with null semester OR empty semester
  const lectures = await Lecture.find({
    $or: [
      { semester: { $exists: false } },
      { semester: null },
      { semester: "" }
    ]
  }).populate("course");

  console.log(`Found ${lectures.length} lectures without semester field`);

  let updated = 0;
  for (const lecture of lectures) {
    const course = lecture.course;
    if (!course) continue;
    
    // Get semester from course
    let semesterVal = "الفصل الدراسي الأول"; // default fallback
    if (course.semester) {
      if (Array.isArray(course.semester) && course.semester.length > 0) {
        semesterVal = course.semester[0];
      } else if (typeof course.semester === "string") {
        semesterVal = course.semester;
      }
    }

    await Lecture.updateOne(
      { _id: lecture._id },
      { $set: { semester: semesterVal } }
    );
    updated++;
    console.log(`Updated lecture ${lecture._id} to semester "${semesterVal}"`);
  }

  console.log(`Updated ${updated} lectures`);
  await mongoose.disconnect();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
