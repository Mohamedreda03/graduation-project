const mongoose = require("mongoose");
const path = require("path");

// Load models
require("dotenv").config();
const { Lecture, AttendanceRecord } = require("./src/models");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mac-attendance");
  console.log("Connected to MongoDB");

  const today = new Date();
  today.setHours(0,0,0,0);
  console.log("Today is:", today.toISOString());

  // Count lectures
  const totalLectures = await Lecture.countDocuments({});
  console.log("Total lectures in DB:", totalLectures);

  // Status breakdown
  const statusCounts = await Lecture.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  console.log("Lecture status breakdown:", statusCounts);

  // Active lectures
  const activeLectures = await Lecture.find({ status: "in-progress" })
    .populate("course", "name code")
    .populate("hall", "name");
  console.log("Active lectures count:", activeLectures.length);
  activeLectures.forEach(l => {
    console.log(`- Course: ${l.course?.name}, Hall: ${l.hall?.name}, Time: ${l.startTime} - ${l.endTime}`);
  });

  // Check today's lectures
  const oneLecture = await Lecture.findOne({});
  console.log("Sample lecture structure:", oneLecture);

  await mongoose.disconnect();
}

run().catch(console.error);
