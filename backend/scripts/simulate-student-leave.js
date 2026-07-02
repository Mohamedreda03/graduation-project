const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { User, AttendanceRecord, StudentSession, ConnectionLog } = require("../src/models");
const { CONNECTION_EVENTS, ATTENDANCE_STATUS } = require("../src/config/constants");
const { calculateMinutes } = require("../src/utils/helpers");

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("📦 Connected to MongoDB");

  // Parse arguments dynamically
  let studentIdentifier = "20240001"; // default: كامل البيانات
  let leaveOffsetMinutes = 30; // default
  let leaveDurationMinutes = 20; // default

  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const arg3 = process.argv[4];

  if (arg1) {
    const parsedNum = Number(arg1);
    if (isNaN(parsedNum) || parsedNum > 1000) {
      studentIdentifier = arg1;
      if (arg2 !== undefined && arg2 !== "") leaveOffsetMinutes = parseInt(arg2);
      if (arg3 !== undefined && arg3 !== "") leaveDurationMinutes = parseInt(arg3);
    } else {
      // It's the minutes offset
      leaveOffsetMinutes = parseInt(arg1);
      if (arg2 !== undefined && arg2 !== "") leaveDurationMinutes = parseInt(arg2);
    }
  }

  // Find Student by studentId or email
  const student = await User.findOne({
    $or: [
      { studentId: studentIdentifier },
      { email: studentIdentifier }
    ]
  });

  if (!student) {
    console.error(`❌ Student with identifier '${studentIdentifier}' not found.`);
    process.exit(1);
  }
  console.log(`👨‍🎓 Found Student: ${student.fullName} (ID: ${student._id}, StudentId: ${student.studentId})`);

  // Find the latest attendance record for this student
  const attendanceRecord = await AttendanceRecord.findOne({ student: student._id })
    .sort({ createdAt: -1 })
    .populate("lecture");

  if (!attendanceRecord) {
    console.error("❌ No attendance record found for this student.");
    process.exit(1);
  }

  const lecture = attendanceRecord.lecture;
  console.log(`📊 Found latest Attendance Record for Lecture: ${lecture._id}`);

  console.log(`⏳ Simulating leaving the lecture ${leaveOffsetMinutes} mins after start, for ${leaveDurationMinutes} mins...`);

  // Determine starting point
  const baseTime = attendanceRecord.lectureStartTime || new Date(attendanceRecord.date);
  
  const disconnectTime = new Date(baseTime.getTime() + leaveOffsetMinutes * 60000);
  const reconnectTime = new Date(disconnectTime.getTime() + leaveDurationMinutes * 60000);

  const hasReturned = leaveDurationMinutes > 0;

  // Split sessions:
  // Session 1: From start until disconnectTime
  const session1 = {
    checkIn: baseTime,
    checkOut: disconnectTime
  };

  const isOngoing = !attendanceRecord.isFinalized;
  const lectureDuration = 120; // default 2 hours
  const baseEndTime = new Date(baseTime.getTime() + lectureDuration * 60000);

  let sessions = [session1];
  if (hasReturned) {
    const session2 = {
      checkIn: reconnectTime,
      checkOut: isOngoing ? undefined : baseEndTime
    };
    sessions.push(session2);
  }

  attendanceRecord.sessions = sessions;

  // Calculate new totalPresenceTime
  let newTotal = calculateMinutes(session1.checkIn, session1.checkOut);
  if (hasReturned) {
    const session2 = sessions[1];
    if (session2.checkOut) {
      newTotal += calculateMinutes(session2.checkIn, session2.checkOut);
    } else {
      const now = new Date();
      const activeEndTime = now > reconnectTime ? now : reconnectTime;
      newTotal += calculateMinutes(session2.checkIn, activeEndTime);
    }
  }

  attendanceRecord.totalPresenceTime = Math.round(newTotal);

  // If finalized, calculate percentage and status
  if (attendanceRecord.isFinalized) {
    attendanceRecord.presencePercentage = Math.round((attendanceRecord.totalPresenceTime / lectureDuration) * 100);
    const minPresence = parseInt(process.env.MIN_PRESENCE_PERCENTAGE) || 50;
    attendanceRecord.status = attendanceRecord.presencePercentage >= minPresence 
      ? ATTENDANCE_STATUS.PRESENT 
      : ATTENDANCE_STATUS.ABSENT;
  }

  await attendanceRecord.save();
  console.log(`✅ Updated Attendance Record sessions:`);
  console.log(`   - Session 1: Check-in: ${session1.checkIn.toLocaleTimeString()}, Check-out: ${session1.checkOut.toLocaleTimeString()}`);
  if (hasReturned) {
    const session2 = sessions[1];
    console.log(`   - Session 2: Check-in: ${session2.checkIn.toLocaleTimeString()}, Check-out: ${session2.checkOut ? session2.checkOut.toLocaleTimeString() : "Ongoing"}`);
  }
  console.log(`   - New Total Presence Time: ${attendanceRecord.totalPresenceTime} mins`);

  // Create Connection Logs for audit trail
  // 1. Disconnect Event
  await ConnectionLog.create({
    macAddress: student.device.macAddress,
    hall: attendanceRecord.hall,
    eventType: CONNECTION_EVENTS.DISCONNECTED,
    timestamp: disconnectTime,
    processed: true,
    student: student._id,
    attendanceRecord: attendanceRecord._id,
    processingResult: "Simulated leave: Student disconnected"
  });

  if (hasReturned) {
    // 2. Reconnect Event
    await ConnectionLog.create({
      macAddress: student.device.macAddress,
      hall: attendanceRecord.hall,
      eventType: CONNECTION_EVENTS.CONNECTED,
      timestamp: reconnectTime,
      processed: true,
      student: student._id,
      attendanceRecord: attendanceRecord._id,
      processingResult: "Simulated return: Student reconnected"
    });
    console.log(`📝 Generated Connection Logs (DISCONNECTED and CONNECTED) to match the simulation.`);
  } else {
    console.log(`📝 Generated Connection Log (DISCONNECTED) to match the simulation.`);
  }

  // Update active StudentSession if ongoing
  if (isOngoing) {
    const studentSession = await StudentSession.findOne({ student: student._id });
    if (studentSession) {
      if (hasReturned) {
        studentSession.isActive = true;
        studentSession.currentHall = attendanceRecord.hall;
        studentSession.currentLecture = attendanceRecord.lecture;
        studentSession.attendanceRecord = attendanceRecord._id;
        studentSession.connectedAt = reconnectTime;
        studentSession.lastActivity = reconnectTime;
        studentSession.disconnectedAt = undefined;
        await studentSession.save();
        console.log(`⚡ Activated and updated StudentSession to reflect reconnect time.`);
      } else {
        studentSession.isActive = false;
        studentSession.disconnectedAt = disconnectTime;
        await studentSession.save();
        console.log(`⚡ Deactivated active StudentSession (Student is now currently offline).`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
