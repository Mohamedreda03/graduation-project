require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./backend/src/models/Course");

mongoose.connect("mongodb://127.0.0.1:27017/attendance-system")
  .then(async () => {
    const course = await Course.findOne({ name: /مادة اثنين/ });
    if (!course) {
      console.log("Course not found");
    } else {
      console.log("Course found:", course.name);
      console.log("Students array length:", course.students.length);
      console.log("Students IDs:", course.students.map(s => s.toString()));
      
      // check if duplicates exist
      const uniqueIds = new Set(course.students.map(s => s.toString()));
      console.log("Unique students length:", uniqueIds.size);
    }
    process.exit(0);
  });
