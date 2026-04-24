const mongoose = require("mongoose");
const { ATTENDANCE_STATUS } = require("../config/constants");

const sessionSchema = new mongoose.Schema({
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: Date,
});

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: [true, "Lecture is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
    },

    date: {
      type: Date,
      required: true,
    },

    // Sessions (check-in/check-out can happen multiple times)
    sessions: [sessionSchema],

    // Calculated after lecture ends
    totalPresenceTime: {
      type: Number,
      default: 0, // in minutes
    },
    lectureTime: {
      type: Number,
      default: 0, // in minutes
    },
    presencePercentage: {
      type: Number,
      default: 0,
    },

    // Final status
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.IN_PROGRESS,
    },

    // Device info
    deviceInfo: {
      macAddress: String,
      ipAddress: String,
      deviceId: String,
    },

    // Finalization
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: Date,

    // Modification tracking (for manual status changes)
    modificationReason: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    modifiedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Compound index for unique attendance per student per lecture per date
attendanceRecordSchema.index(
  { student: 1, lecture: 1, date: 1 },
  { unique: true },
);
attendanceRecordSchema.index({ course: 1, date: 1 });
attendanceRecordSchema.index({ hall: 1, date: 1, status: 1 });

// Add a new session (check-in)
attendanceRecordSchema.methods.addCheckIn = function (
  checkInTime = new Date(),
) {
  this.sessions.push({ checkIn: checkInTime });
  return this.save();
};

// Update last session with check-out
attendanceRecordSchema.methods.addCheckOut = function (
  checkOutTime = new Date(),
) {
  if (this.sessions.length === 0) return this;

  const lastSession = this.sessions[this.sessions.length - 1];
  if (!lastSession.checkOut) {
    lastSession.checkOut = checkOutTime;
  }
  return this.save();
};

// Calculate total presence time
attendanceRecordSchema.methods.calculatePresence = function (lectureEndTime) {
  let totalMinutes = 0;

  for (const session of this.sessions) {
    const checkIn = new Date(session.checkIn);
    const checkOut = session.checkOut
      ? new Date(session.checkOut)
      : lectureEndTime;
    const diff = (checkOut - checkIn) / (1000 * 60); // Convert to minutes
    totalMinutes += Math.max(0, diff);
  }

  this.totalPresenceTime = Math.round(totalMinutes);
  return this.totalPresenceTime;
};

// Finalize attendance record
attendanceRecordSchema.methods.finalize = function (
  lectureTime,
  minPresencePercentage = 85,
) {
  if (this.isFinalized) return this;

  this.lectureTime = lectureTime;
  this.presencePercentage =
    this.lectureTime > 0
      ? Math.round((this.totalPresenceTime / this.lectureTime) * 100)
      : 0;

  this.status =
    this.presencePercentage >= minPresencePercentage
      ? ATTENDANCE_STATUS.PRESENT
      : ATTENDANCE_STATUS.ABSENT;

  this.isFinalized = true;
  this.finalizedAt = new Date();

  return this.save();
};

// Get today's date (without time) for querying
attendanceRecordSchema.statics.getTodayDate = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Find or create attendance record for student in current lecture
attendanceRecordSchema.statics.findOrCreateForStudent = async function (
  studentId,
  lectureId,
  courseId,
  hallId,
  deviceInfo,
) {
  const today = this.getTodayDate();

  let record = await this.findOne({
    student: studentId,
    lecture: lectureId,
    date: today,
  });

  if (!record) {
    record = new this({
      student: studentId,
      lecture: lectureId,
      course: courseId,
      hall: hallId,
      date: today,
      deviceInfo,
      sessions: [],
    });
    await record.save();
  }

  return record;
};

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
