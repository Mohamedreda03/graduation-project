const cron = require("node-cron");
const {
  AttendanceRecord,
  Lecture,
  StudentSession,
  Setting,
  Course,
} = require("../models");
const { ATTENDANCE_STATUS } = require("../config/constants");

/**
 * Finalize attendance records for ended lectures
 */
async function finalizeAttendanceRecords() {
  console.log("[Scheduler] Running attendance finalization...");

  try {
    // Get settings
    const minPresenceSetting = await Setting.findOne({
      key: "MIN_PRESENCE_PERCENTAGE",
    });
    const minPresencePercentage = minPresenceSetting
      ? minPresenceSetting.value
      : 85;

    const autoFinalizeSetting = await Setting.findOne({
      key: "AUTO_FINALIZE_AFTER_MINUTES",
    });
    const autoFinalizeMinutes = autoFinalizeSetting
      ? autoFinalizeSetting.value
      : 30;

    // Find in-progress records that should be finalized
    const records = await AttendanceRecord.find({
      status: ATTENDANCE_STATUS.IN_PROGRESS,
      isFinalized: false,
    }).populate("lecture");

    const now = new Date();
    let finalized = 0;

    for (const record of records) {
      if (!record.lecture) continue;

      // Calculate when the lecture ended
      const lectureEnd = getLectureEndTime(record.date, record.lecture.endTime);
      const finalizeAfter = new Date(
        lectureEnd.getTime() + autoFinalizeMinutes * 60 * 1000,
      );

      if (now >= finalizeAfter) {
        // Close any open sessions
        const lastSession = record.sessions[record.sessions.length - 1];
        if (lastSession && !lastSession.checkOut) {
          lastSession.checkOut = lectureEnd;
          const duration = Math.round(
            (lectureEnd - lastSession.checkIn) / 60000,
          );
          lastSession.duration = duration > 0 ? duration : 0;
          record.totalPresenceTime += lastSession.duration;
        }

        // Calculate lecture duration
        const lectureDuration = calculateLectureDuration(
          record.lecture.startTime,
          record.lecture.endTime,
        );

        // Calculate presence percentage
        const presencePercentage =
          lectureDuration > 0
            ? (record.totalPresenceTime / lectureDuration) * 100
            : 0;

        record.presencePercentage = Math.min(
          Math.round(presencePercentage),
          100,
        );

        // Determine final status
        if (record.presencePercentage >= minPresencePercentage) {
          record.status = ATTENDANCE_STATUS.PRESENT;
        } else if (record.presencePercentage > 0) {
          record.status = ATTENDANCE_STATUS.ABSENT; // Not enough presence
        } else {
          record.status = ATTENDANCE_STATUS.ABSENT;
        }

        record.isFinalized = true;
        await record.save();
        finalized++;
      }
    }

    console.log(`[Scheduler] Finalized ${finalized} attendance records`);
  } catch (error) {
    console.error("[Scheduler] Error finalizing attendance:", error);
  }
}

/**
 * Mark absent students for past lectures
 */
async function markAbsentStudents() {
  console.log("[Scheduler] Marking absent students...");

  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.getDay();

    // Find all lectures that should have ended by now
    const lectures = await Lecture.find({
      dayOfWeek,
      isActive: true,
    }).populate("course");

    for (const lecture of lectures) {
      const lectureEnd = getLectureEndTime(today, lecture.endTime);

      // Only process if lecture has ended
      if (now < lectureEnd) continue;

      // Get enrolled students
      const course = await Course.findById(lecture.course._id).populate(
        "students",
      );
      if (!course || !course.students) continue;

      for (const student of course.students) {
        // Check if attendance record exists
        const exists = await AttendanceRecord.findOne({
          student: student._id,
          lecture: lecture._id,
          date: today,
        });

        if (!exists) {
          // Create absent record
          await AttendanceRecord.create({
            student: student._id,
            course: lecture.course._id,
            lecture: lecture._id,
            hall: lecture.hall,
            date: today,
            status: ATTENDANCE_STATUS.ABSENT,
            sessions: [],
            totalPresenceTime: 0,
            presencePercentage: 0,
            isFinalized: true,
          });
        }
      }
    }

    console.log("[Scheduler] Absent marking completed");
  } catch (error) {
    console.error("[Scheduler] Error marking absents:", error);
  }
}

/**
 * Clean up stale sessions
 */
async function cleanupStaleSessions() {
  console.log("[Scheduler] Cleaning up stale sessions...");

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await StudentSession.updateMany(
      {
        isActive: true,
        connectedAt: { $lt: twoHoursAgo },
      },
      {
        $set: {
          isActive: false,
          disconnectedAt: new Date(),
        },
      },
    );

    console.log(
      `[Scheduler] Deactivated ${result.modifiedCount} stale sessions`,
    );
  } catch (error) {
    console.error("[Scheduler] Error cleaning sessions:", error);
  }
}

/**
 * Helper: Get lecture end time as Date object
 */
function getLectureEndTime(date, endTimeStr) {
  const [hours, minutes] = endTimeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Helper: Calculate lecture duration in minutes
 */
function calculateLectureDuration(startTimeStr, endTimeStr) {
  const [startH, startM] = startTimeStr.split(":").map(Number);
  const [endH, endM] = endTimeStr.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return endMinutes - startMinutes;
}

/**
 * Initialize scheduler jobs
 */
function initScheduler() {
  console.log("[Scheduler] Initializing scheduled jobs...");

  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await finalizeAttendanceRecords();
  });

  // Run every hour at minute 30
  cron.schedule("30 * * * *", async () => {
    await markAbsentStudents();
  });

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    await cleanupStaleSessions();
  });

  console.log("[Scheduler] Scheduled jobs initialized");
}

module.exports = {
  initScheduler,
  finalizeAttendanceRecords,
  markAbsentStudents,
  cleanupStaleSessions,
};
