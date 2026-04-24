const mongoose = require("mongoose");

const studentSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Device info
    deviceId: String,
    macAddress: String,

    // Current connection
    currentHall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
    },
    currentLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
    },
    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceRecord",
    },
    connectedAt: Date,
    disconnectedAt: Date,

    // Session state
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Network verification
    networkVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast lookups
studentSessionSchema.index({ student: 1, isActive: 1 });
studentSessionSchema.index({ macAddress: 1, isActive: 1 });
studentSessionSchema.index({ currentHall: 1, isActive: 1 });

// Find active session for student
studentSessionSchema.statics.findActiveSession = function (studentId) {
  return this.findOne({ student: studentId, isActive: true });
};

// Find active session by MAC
studentSessionSchema.statics.findByMac = function (macAddress) {
  return this.findOne({ macAddress, isActive: true });
};

// Deactivate session
studentSessionSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model("StudentSession", studentSessionSchema);
