const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const env = require('../config/env');

const connectDB = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

const fixEnrolledCourses = async () => {
  try {
    await connectDB();

    console.log('Finding all students...');
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students. Checking courses...`);

    let fixedCount = 0;

    for (const student of students) {
      // Find all courses where this student is in the students array
      const courses = await Course.find({ students: student._id });
      const courseIds = courses.map(c => c._id);

      // Check if student's enrolledCourses matches
      const currentEnrolled = student.academicInfo?.enrolledCourses || [];
      
      // If current enrolled doesn't have all the courses they are actually in
      if (currentEnrolled.length !== courseIds.length) {
        if (!student.academicInfo) {
          student.academicInfo = {};
        }
        student.academicInfo.enrolledCourses = courseIds;
        await student.save({ validateBeforeSave: false });
        console.log(`Fixed student ${student.name.first} ${student.name.last} (${student.email}). Restored ${courseIds.length} courses.`);
        fixedCount++;
      }
    }

    console.log(`Finished fixing enrolled courses. Total fixed: ${fixedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing enrolled courses:', error);
    process.exit(1);
  }
};

fixEnrolledCourses();
