const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Lecture, AttendanceRecord, StudentSession, Setting } = require("../src/models");
const { ATTENDANCE_STATUS } = require("../src/config/constants");
const { getTodayDate, calculateMinutes } = require("../src/utils/helpers");

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("📦 Connected to MongoDB");

  let lecture;
  const lectureIdArg = process.argv[2];

  if (lectureIdArg) {
    lecture = await Lecture.findById(lectureIdArg)
      .populate("course", "name code students")
      .populate("hall", "name building")
      .populate("doctor", "name");
    if (!lecture) {
      console.error(`❌ Lecture with ID ${lectureIdArg} not found.`);
      process.exit(1);
    }
  } else {
    // Find currently active lecture
    lecture = await Lecture.findOne({ isActive: true })
      .populate("course", "name code students")
      .populate("hall", "name building")
      .populate("doctor", "name");
    
    if (!lecture) {
      // Try finding one in-progress
      lecture = await Lecture.findOne({ status: "in-progress" })
        .populate("course", "name code students")
        .populate("hall", "name building")
        .populate("doctor", "name");
    }

    if (!lecture) {
      console.error("❌ No active or in-progress lecture found to end.");
      process.exit(1);
    }
  }

  console.log(`👨‍🏫 Ending Lecture: ${lecture._id} | Course: ${lecture.course?.name || "Unknown"} | Hall: ${lecture.hall?.name || "Unknown"}`);

  const now = new Date();

  // 1. Update Lecture status
  lecture.status = "completed";
  lecture.isActive = false;
  lecture.actualEndTime = now;
  await lecture.save();
  console.log("✅ Lecture status updated to 'completed' and deactivated.");

  // 2. Set the end time on all attendance records for today
  await AttendanceRecord.updateMany(
    { lecture: lecture._id, date: getTodayDate() },
    { $set: { lectureEndTime: lecture.actualEndTime } }
  );

  // 3. Finalize in-progress records
  const records = await AttendanceRecord.find({
    lecture: lecture._id,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  });

  // Load min presence percentage setting
  const minPresenceSetting = await Setting.findOne({ key: "MIN_PRESENCE_PERCENTAGE" });
  const minPresencePercentage = minPresenceSetting ? parseInt(minPresenceSetting.value) : 50;

  // Calculate actual lecture duration in minutes
  const lectureStartTime = lecture.actualStartTime || new Date(lecture.createdAt);
  const actualDuration = Math.round((lecture.actualEndTime - lectureStartTime) / 60000);
  const lectureDuration = Math.max(1, actualDuration); // Use actual elapsed time, minimum 1 min

  console.log(`⏱️  Lecture Duration: ${lectureDuration} minutes. Min presence needed: ${minPresencePercentage}%`);

  for (const record of records) {
    record.lectureEndTime = lecture.actualEndTime;

    // Close any open sessions within the record
    if (record.sessions && record.sessions.length > 0) {
      const lastSession = record.sessions[record.sessions.length - 1];
      if (!lastSession.checkOut) {
        lastSession.checkOut = now;

        // Cap checkIn time to actual lecture start time
        let effectiveCheckIn = new Date(lastSession.checkIn);
        if (lecture.actualStartTime && effectiveCheckIn < lecture.actualStartTime) {
          effectiveCheckIn = new Date(lecture.actualStartTime);
        }

        const diffMins = calculateMinutes(effectiveCheckIn, now);
        lastSession.duration = Math.max(0, diffMins);
        record.totalPresenceTime += lastSession.duration;
      }
    }

    // Calculate presence percentage
    const presencePercentage = lectureDuration > 0
      ? (record.totalPresenceTime / lectureDuration) * 100
      : 0;

    record.presencePercentage = Math.min(Math.round(presencePercentage), 100);

    // Determine final status
    const finalStatus = record.presencePercentage >= minPresencePercentage
      ? ATTENDANCE_STATUS.PRESENT
      : ATTENDANCE_STATUS.ABSENT;

    // Save/update the record in database
    await AttendanceRecord.updateOne(
      { _id: record._id },
      {
        $set: {
          status: finalStatus,
          presencePercentage: record.presencePercentage,
          isFinalized: true,
          finalizedAt: now,
          totalPresenceTime: record.totalPresenceTime,
          lectureEndTime: lecture.actualEndTime,
          sessions: record.sessions
        }
      }
    );
    
    console.log(`   - Student (ID: ${record.student}): Presence ${record.presencePercentage}%, Status: ${finalStatus}`);
  }

  console.log(`✅ Finalized ${records.length} in-progress attendance records.`);

  // 4. Create absent records for enrolled students who never joined
  const allRecords = await AttendanceRecord.find({
    lecture: lecture._id,
    date: getTodayDate(),
  });
  const allRecordStudentIds = new Set(allRecords.map(r => r.student.toString()));
  const enrolledStudents = lecture.course?.students || [];

  const missingStudents = enrolledStudents.filter(
    sId => !allRecordStudentIds.has(sId.toString())
  );

  if (missingStudents.length > 0) {
    const newAbsentRecords = missingStudents.map(studentId => ({
      student: studentId,
      course: lecture.course._id,
      lecture: lecture._id,
      hall: lecture.hall._id,
      date: getTodayDate(),
      status: ATTENDANCE_STATUS.ABSENT,
      isFinalized: true,
      finalizedAt: now,
      lectureStartTime: lecture.actualStartTime,
      lectureEndTime: lecture.actualEndTime,
      presencePercentage: 0,
      totalPresenceTime: 0,
      sessions: []
    }));

    await AttendanceRecord.insertMany(newAbsentRecords);
    console.log(`📝 Created ${newAbsentRecords.length} absent records for students who never joined.`);
  }

  // 5. Close all active StudentSessions linked to this lecture
  const closedSessions = await StudentSession.updateMany(
    { currentLecture: lecture._id, isActive: true },
    {
      $set: {
        isActive: false,
        disconnectedAt: now,
      },
    }
  );
  console.log(`⚡ Closed ${closedSessions.modifiedCount} active student sessions linked to this lecture.`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
