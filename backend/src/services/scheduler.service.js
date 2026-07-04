const cron = require("node-cron");
const mongoose = require("mongoose");
const {
  AttendanceRecord,
  Lecture,
  StudentSession,
  Setting,
  Course,
} = require("../models");
const { ATTENDANCE_STATUS } = require("../config/constants");
const { getLocalTime, getTodayDate, getAbsoluteTimeFromLocal } = require("../utils/helpers");

/**
 * Check if MongoDB is connected before running scheduler tasks
 * @returns {boolean}
 */
function isDbReady() {
  return mongoose.connection.readyState === 1;
}

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
      : 50;

    const autoFinalizeSetting = await Setting.findOne({
      key: "AUTO_FINALIZE_AFTER_MINUTES",
    });
    const autoFinalizeMinutes = autoFinalizeSetting
      ? autoFinalizeSetting.value
      : 30;

    // Find in-progress records that should be finalized using cursor to prevent memory overload
    const cursor = AttendanceRecord.find({
      status: ATTENDANCE_STATUS.IN_PROGRESS,
      isFinalized: false,
    })
      .populate("lecture")
      .cursor();

    const now = new Date();
    let finalized = 0;

    for await (const record of cursor) {
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
    const localNow = getLocalTime();
    const today = getTodayDate();

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = localNow.getDay();

    // Find all completed lectures on this day using cursor
    const cursor = Lecture.find({
      dayOfWeek,
      isActive: true,
      status: "completed",
    })
      .populate("course")
      .cursor();

    for await (const lecture of cursor) {
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
  // Use the new helper to correctly calculate the absolute UTC time
  // based on the provided "shifted" date and local HH:MM time string.
  return getAbsoluteTimeFromLocal(date, endTimeStr);
}

/**
 * Helper: Calculate lecture duration in minutes
 */
function calculateLectureDuration(startTimeStr, endTimeStr) {
  const [startH, startM] = startTimeStr.split(":").map(Number);
  const [endH, endM] = endTimeStr.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle midnight-spanning lectures (e.g., 23:30 -> 01:30)
  if (endMinutes <= startMinutes) {
    return (1440 - startMinutes) + endMinutes;
  }
  return endMinutes - startMinutes;
}

/**
 * Helper: Get the date of the most recent occurrence of a day of week
 */
function getMostRecentDayOfWeekDate(dayOfWeek) {
  const result = getLocalTime();
  const currentDay = result.getDay();
  let distance = currentDay - dayOfWeek;
  if (distance < 0) {
    distance += 7;
  }
  result.setDate(result.getDate() - distance);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Automatically complete ended lectures that are still in-progress
 * Also finalizes all attendance records immediately (no delay)
 */
async function autoCompleteLectures() {
  console.log("[Scheduler] Checking for ended in-progress lectures...");
  try {
    const now = new Date();

    const minPresenceSetting = await Setting.findOne({ key: "MIN_PRESENCE_PERCENTAGE" });
    const minPresencePercentage = minPresenceSetting ? parseInt(minPresenceSetting.value) : 50;

    const lectures = await Lecture.find({
      status: "in-progress",
      isActive: true,
    });

    let completedCount = 0;

    for (const lecture of lectures) {
      // Determine when the lecture should end.
      // For midnight-spanning lectures (e.g. startTime 23:30, endTime 01:30),
      // the endTime is on the NEXT day relative to the start day.
      const baseDate = getMostRecentDayOfWeekDate(lecture.dayOfWeek);
      let lectureEnd = getLectureEndTime(baseDate, lecture.endTime);

      // Check if this is a midnight-spanning lecture
      const [startH, startM] = lecture.startTime.split(":").map(Number);
      const [endH, endM] = lecture.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (endMinutes <= startMinutes) {
        // End time is on the next day, add 24 hours
        lectureEnd = new Date(lectureEnd.getTime() + 24 * 60 * 60 * 1000);
      }

      if (now < lectureEnd) continue;

      // 1. Mark lecture as completed with actual end time
      lecture.status = "completed";
      lecture.actualEndTime = lecture.actualEndTime || lectureEnd;
      await lecture.save();
      completedCount++;
      console.log(`[Scheduler] Auto-completed lecture ${lecture._id} (${lecture.startTime} - ${lecture.endTime})`);

      const actualEndTime = lecture.actualEndTime;
      const lectureStartTime = lecture.actualStartTime || lectureEnd; // fallback
      const lectureDuration = Math.max(1, Math.round((actualEndTime - lectureStartTime) / 60000));

      // 2. Finalize all in-progress attendance records for this lecture RIGHT NOW
      const records = await AttendanceRecord.find({
        lecture: lecture._id,
        status: ATTENDANCE_STATUS.IN_PROGRESS,
      });

      for (const record of records) {
        // Close any open session
        let totalPresenceTime = record.totalPresenceTime || 0;
        const sessions = record.sessions || [];

        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1];
          if (!lastSession.checkOut) {
            lastSession.checkOut = actualEndTime;

            // Cap checkIn to lecture actual start time
            let effectiveCheckIn = new Date(lastSession.checkIn);
            if (lecture.actualStartTime && effectiveCheckIn < lecture.actualStartTime) {
              effectiveCheckIn = new Date(lecture.actualStartTime);
            }

            const diffMins = Math.max(0, Math.round((actualEndTime - effectiveCheckIn) / 60000));
            lastSession.duration = diffMins;
            totalPresenceTime += diffMins;
          }
        }

        const cappedPresenceTime = Math.min(totalPresenceTime, lectureDuration);
        const presencePercentage = Math.min(100, Math.round((cappedPresenceTime / lectureDuration) * 100));
        const finalStatus = presencePercentage >= minPresencePercentage
          ? ATTENDANCE_STATUS.PRESENT
          : ATTENDANCE_STATUS.ABSENT;

        await AttendanceRecord.updateOne(
          { _id: record._id },
          {
            $set: {
              status: finalStatus,
              presencePercentage,
              totalPresenceTime: cappedPresenceTime,
              isFinalized: true,
              finalizedAt: now,
              lectureEndTime: actualEndTime,
              sessions,
            },
          }
        );
      }

      // 3. Close all active StudentSessions for this lecture
      await StudentSession.updateMany(
        { currentLecture: lecture._id, isActive: true },
        { $set: { isActive: false, disconnectedAt: actualEndTime } }
      );

      console.log(`[Scheduler] Finalized ${records.length} attendance records for lecture ${lecture._id}`);
    }

    if (completedCount > 0) {
      console.log(`[Scheduler] Auto-completed ${completedCount} lectures`);
    }
  } catch (error) {
    console.error("[Scheduler] Error auto-completing lectures:", error);
  }
}

/**
 * Reset completed/cancelled lectures status back to scheduled
 */
async function resetLecturesStatus() {
  console.log("[Scheduler] Resetting completed lectures to scheduled status...");
  try {
    const result = await Lecture.updateMany(
      {
        isActive: true,
        status: { $in: ["completed", "cancelled"] },
      },
      {
        $set: { status: "scheduled" },
      }
    );
    console.log(`[Scheduler] Reset ${result.modifiedCount} lectures to scheduled status`);
  } catch (error) {
    console.error("[Scheduler] Error resetting lectures status:", error);
  }
}

/**
 * Initialize scheduler jobs
 */
function initScheduler() {
  console.log("[Scheduler] Initializing scheduled jobs...");

  // Run every 30 seconds to quickly detect and auto-complete ended lectures
  cron.schedule("*/30 * * * * *", async () => {
    if (!isDbReady()) {
      console.log("[Scheduler] Skipping finalization - DB not ready");
      return;
    }
    await finalizeAttendanceRecords();
    await autoCompleteLectures();
  });

  // Run every hour at minute 30
  cron.schedule("30 * * * *", async () => {
    if (!isDbReady()) {
      console.log("[Scheduler] Skipping absent marking - DB not ready");
      return;
    }
    await markAbsentStudents();
  });

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    if (!isDbReady()) {
      console.log("[Scheduler] Skipping session cleanup - DB not ready");
      return;
    }
    await cleanupStaleSessions();
  });

  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    if (!isDbReady()) {
      console.log("[Scheduler] Skipping lecture reset - DB not ready");
      return;
    }
    await resetLecturesStatus();
  });

  console.log("[Scheduler] Scheduled jobs initialized");
}


module.exports = {
  initScheduler,
  finalizeAttendanceRecords,
  autoCompleteLectures,
  resetLecturesStatus,
  markAbsentStudents,
  cleanupStaleSessions,
};
