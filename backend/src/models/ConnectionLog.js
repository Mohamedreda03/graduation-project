const mongoose = require("mongoose");
const { CONNECTION_EVENTS } = require("../config/constants");

const connectionLogSchema = new mongoose.Schema(
  {
    macAddress: {
      type: String,
      required: [true, "MAC Address is required"],
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
    },

    eventType: {
      type: String,
      enum: Object.values(CONNECTION_EVENTS),
      required: [true, "Event type is required"],
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Processing status
    processed: {
      type: Boolean,
      default: false,
    },
    processingResult: {
      type: String,
      trim: true,
    },
    matchedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceRecord",
    },
    processingError: String,
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
connectionLogSchema.index({ macAddress: 1, timestamp: -1 });
connectionLogSchema.index({ hall: 1, timestamp: -1 });
connectionLogSchema.index({ processed: 1 });

module.exports = mongoose.model("ConnectionLog", connectionLogSchema);
